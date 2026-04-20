#!/usr/bin/env python3
"""
Edit IMG_2238.PNG via KIE Flux Kontext: remove hands, remove TikTok UI,
produce a clean editorial shot of the packed order box.

Usage:
    python tools/edit_box_image.py            # run with flux-kontext-pro
    python tools/edit_box_image.py --model max
    python tools/edit_box_image.py --dry-run
"""

import argparse
import os
import sys
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / ".env")

KIE_API_KEY = os.getenv("KIE_API_KEY")
BASE_URL = "https://api.kie.ai"
GENERATE_URL = f"{BASE_URL}/api/v1/flux/kontext/generate"
POLL_URL = f"{BASE_URL}/api/v1/flux/kontext/record-info"

SOURCE_IMAGE = ROOT / "brand-assets" / "other" / "IMG_2238.PNG"
OUTPUT_PATH = ROOT / "brand-assets" / "generated" / "order-box.jpg"

POLL_INTERVAL = 6
MAX_WAIT = 360

PROMPT = (
    "Remove the gloved hands entirely from the image. "
    "Remove all phone UI — status bar, video player controls, and any text overlays. "
    "Show a clean, straight editorial shot of the open shipping box filled with brown "
    "crinkle paper packing material and the fragrance product nestled inside. "
    "Slight top-down angle. Clean white or neutral surface below the box. "
    "No hands, no people, no UI elements. "
    "E-commerce product photography style — sharp, well-lit, minimal."
)


def upload_image(path: Path) -> str:
    print(f"  Uploading {path.name} to uguu.se...")
    with open(path, "rb") as f:
        resp = requests.post(
            "https://uguu.se/upload",
            files={"files[]": (path.name, f, "image/png")},
            timeout=45,
        )
    resp.raise_for_status()
    data = resp.json()
    if not data.get("success"):
        raise RuntimeError(f"uguu.se upload failed: {data}")
    url = data["files"][0]["url"]
    print(f"  Uploaded -> {url}")
    return url


def get_headers() -> dict:
    return {
        "Authorization": f"Bearer {KIE_API_KEY}",
        "Content-Type": "application/json",
    }


def submit_job(input_url: str, model: str) -> str:
    payload = {
        "prompt": PROMPT,
        "aspectRatio": "3:4",
        "outputFormat": "jpeg",
        "model": f"flux-kontext-{model}",
        "safetyTolerance": 4,
        "inputImage": input_url,
    }
    resp = requests.post(GENERATE_URL, headers=get_headers(), json=payload, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    if data.get("code") != 200:
        raise RuntimeError(f"KIE API error on submit: {data}")
    task_id = data["data"]["taskId"]
    print(f"  Submitted -> taskId: {task_id}")
    return task_id


def poll_until_done(task_id: str) -> str:
    deadline = time.time() + MAX_WAIT
    while time.time() < deadline:
        resp = requests.get(
            POLL_URL,
            headers=get_headers(),
            params={"taskId": task_id},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        if data.get("code") != 200:
            raise RuntimeError(f"KIE poll error: {data}")
        flag = data["data"].get("successFlag")
        print(f"    [{task_id}] successFlag: {flag}", end="\r")
        if flag == 1:
            print()
            return data["data"]["response"]["resultImageUrl"]
        if flag in (2, 3):
            raise RuntimeError(f"KIE generation failed (flag={flag}): {data['data'].get('errorMessage')}")
        time.sleep(POLL_INTERVAL)
    raise TimeoutError(f"Job {task_id} did not complete in {MAX_WAIT}s")


def download_image(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    resp = requests.get(url, timeout=90, stream=True)
    resp.raise_for_status()
    with open(dest, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            f.write(chunk)
    size_kb = dest.stat().st_size // 1024
    print(f"  Saved -> {dest.relative_to(ROOT)} ({size_kb} KB)")


def main():
    parser = argparse.ArgumentParser(description="Edit box image via KIE Flux Kontext")
    parser.add_argument("--model", choices=["pro", "max"], default="pro")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if args.dry_run:
        print(f"[dry-run] Model: flux-kontext-{args.model}")
        print(f"[dry-run] Source: {SOURCE_IMAGE.relative_to(ROOT)}")
        print(f"[dry-run] Output: {OUTPUT_PATH.relative_to(ROOT)}")
        print(f"[dry-run] Prompt ({len(PROMPT)} chars):\n  {PROMPT}")
        return

    if not KIE_API_KEY:
        print("ERROR: KIE_API_KEY not found in .env", file=sys.stderr)
        sys.exit(1)

    print(f"\n[edit-box-image] model=flux-kontext-{args.model}")
    input_url = upload_image(SOURCE_IMAGE)
    task_id = submit_job(input_url, args.model)
    result_url = poll_until_done(task_id)
    download_image(result_url, OUTPUT_PATH)
    print("\nDone.")


if __name__ == "__main__":
    main()
