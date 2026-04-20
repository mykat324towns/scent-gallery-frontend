#!/usr/bin/env python3
"""
KIE Flux Kontext image generator for Scent Gallery homepage.
Generates hero panel, CTA section, and How It Works backgrounds.

Usage:
    python tools/generate_hero_images.py                    # all images
    python tools/generate_hero_images.py --image hero       # single image
    python tools/generate_hero_images.py --dry-run          # print prompts, no API calls
    python tools/generate_hero_images.py --model max        # use flux-kontext-max
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
OUTPUT_DIR = ROOT / "brand-assets" / "generated"

POLL_INTERVAL = 6   # seconds between polls
MAX_WAIT = 360      # 6 minutes max per image

BOTTLE_VIBRATO = ROOT / "brand-assets" / "other" / "Sospiro Vibrato.png"
BOTTLE_LEBEAU  = ROOT / "brand-assets" / "other" / "Le beau le parfum.png"

JOBS = {
    "hero": {
        "output": "hero-panel-bg.jpg",
        "aspectRatio": "16:9",
        "outputFormat": "jpeg",
        "safetyTolerance": 4,
        "inputImage": None,  # built dynamically by build_composite_input()
        "prompt": (
            "Cinematic luxury fashion editorial photography, ultra-wide 16:9 letterbox format. "
            "COMPOSITION RULE: the LEFT 40% of the frame must be pure near-black (#0D0D0D) — "
            "almost no detail, just faint atmospheric depth. This zone is reserved for white text overlay. "
            "The RIGHT 60% of the frame contains both fragrance bottles as the hero subjects. "
            "Right-side left bottle: Sospiro Vibrato — deep forest green velvet rounded bottle, "
            "dramatic sculptural gold crown cap with twin peaks, gold oval VIBRATO medallion on front, "
            "rich plush velvet texture. Right-side right bottle: Jean Paul Gaultier Le Beau Le Parfum — "
            "iconic sculpted black male torso bottle, gradient from jet black at top through deep "
            "teal-emerald to crystal-clear glass at base, small gold fleur ornament at waist, "
            "sharp angular faceted glass. Both bottles large, bottom-aligned, rendered hyper-realistically "
            "as physical objects. Deep emerald (#1C4032) volumetric smoke swirling at the bases, "
            "drifting left into the dark zone. Single dramatic key light from upper right, strong specular "
            "highlights on gold hardware and glass facets. Smooth gradient transition from the near-black "
            "left zone into the bottle scene on the right — no hard line, natural atmospheric fade. "
            "Color palette: near-black, forest green, deep emerald, warm gold. Hype fashion editorial — "
            "bold, high-contrast, cinematic, dark luxury. No text, no logos, no people."
        ),
    },
    "cta": {
        "output": "cta-section-bg.jpg",
        "aspectRatio": "21:9",
        "outputFormat": "jpeg",
        "safetyTolerance": 4,
        "inputImage": None,
        "prompt": (
            "Ultra-wide cinematic abstract atmospheric background for a luxury fragrance brand website. "
            "Deep emerald green (#1C4032) and near-black (#0D0D0D) color field with subtle volumetric "
            "light diffusion — like light refracting through dark glass or perfume smoke drifting in a "
            "dimly lit room. Faint texture suggesting dark velvet or silk. Very subtle horizontal depth "
            "and motion. Palette: forest green, bottle green, near-black, with faint warm gold highlights "
            "concentrated at the left third. Extremely dark — average luminance must be 15-20%, "
            "this is a text backdrop for white copy. No objects. No bottles. No faces. No text. "
            "Pure mood and luxury atmosphere. Cinematic wide letterbox format."
        ),
    },
    "how-it-works": {
        "output": "how-it-works-bg.jpg",
        "aspectRatio": "16:9",
        "outputFormat": "jpeg",
        "safetyTolerance": 4,
        "inputImage": None,
        "prompt": (
            "Extremely subtle dark textured background for a luxury e-commerce website section. "
            "Near-black (#111111) base with an almost imperceptible layer of very dark forest green "
            "smoke or mist drifting through the frame. Faint out-of-focus organic textures suggesting "
            "dark velvet, moss, or aged dark wood grain — barely visible. Ultra low contrast. "
            "Average brightness approximately 12-18%. This image must sit behind white text without "
            "competing — it provides depth, not drama. No identifiable objects. No people. No bottles. "
            "No text. Atmospheric and refined. A dark whisper of texture, not a statement."
        ),
    },
}


def build_composite_input() -> str:
    """
    Composite Sospiro Vibrato + Le Beau Le Parfum onto a dark canvas,
    upload to 0x0.st, and return the public URL for img2img.
    """
    try:
        from PIL import Image
    except ImportError:
        raise RuntimeError("Pillow required: pip install Pillow")

    def remove_white_bg(img: Image.Image, threshold: int = 238) -> Image.Image:
        img = img.convert("RGBA")
        data = list(img.getdata())
        new_data = [
            (0, 0, 0, 0) if r > threshold and g > threshold and b > threshold else (r, g, b, a)
            for r, g, b, a in data
        ]
        img.putdata(new_data)
        bb = img.getbbox()
        return img.crop(bb) if bb else img

    def scale_to_height(img: Image.Image, target_h: int) -> Image.Image:
        ratio = target_h / img.height
        return img.resize((int(img.width * ratio), target_h), Image.LANCZOS)

    print("  Loading bottle images...")
    vibrato = remove_white_bg(Image.open(BOTTLE_VIBRATO))
    lebeau  = remove_white_bg(Image.open(BOTTLE_LEBEAU))

    # Portrait canvas: 960 x 1280 (#0D0D0D)
    cw, ch = 960, 1280
    canvas = Image.new("RGBA", (cw, ch), (13, 13, 13, 255))

    # Scale after crop: Sospiro 72% height (left), Le Beau 90% height (right)
    vibrato = scale_to_height(vibrato, int(ch * 0.72))
    lebeau  = scale_to_height(lebeau,  int(ch * 0.90))

    # Both bottom-aligned; slight center overlap for cinematic depth
    vib_x = int(cw * 0.02)
    vib_y = ch - vibrato.height

    lb_x = int(cw * 0.42)
    lb_y = ch - lebeau.height

    canvas.paste(vibrato, (vib_x, vib_y), vibrato.split()[3])
    canvas.paste(lebeau,  (lb_x, lb_y),  lebeau.split()[3])

    composite_path = ROOT / "tmp" / "hero-composite-input.png"
    canvas.convert("RGB").save(str(composite_path))
    kb = composite_path.stat().st_size // 1024
    print(f"  Composite saved -> tmp/hero-composite-input.png ({kb} KB)")

    print("  Uploading to uguu.se...")
    with open(composite_path, "rb") as f:
        resp = requests.post(
            "https://uguu.se/upload",
            files={"files[]": ("composite.png", f, "image/png")},
            timeout=45,
        )
    resp.raise_for_status()
    data = resp.json()
    if not data.get("success"):
        raise RuntimeError(f"uguu.se upload failed: {data}")
    url = data["files"][0]["url"]
    print(f"  Composite URL -> {url}")
    return url


def get_headers() -> dict:
    return {
        "Authorization": f"Bearer {KIE_API_KEY}",
        "Content-Type": "application/json",
    }


def submit_job(job: dict, model: str) -> str:
    payload = {
        "prompt": job["prompt"],
        "aspectRatio": job["aspectRatio"],
        "outputFormat": job["outputFormat"],
        "model": f"flux-kontext-{model}",
        "safetyTolerance": job["safetyTolerance"],
    }
    if job.get("inputImage"):
        payload["inputImage"] = job["inputImage"]

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


def run(job_keys: list, model: str = "pro", dry_run: bool = False) -> None:
    if not KIE_API_KEY and not dry_run:
        print("ERROR: KIE_API_KEY not found in .env", file=sys.stderr)
        sys.exit(1)

    for key in job_keys:
        job = JOBS[key].copy()

        print(f"\n[{key}] -> {job['output']}")

        if dry_run:
            print(f"  Model: flux-kontext-{model}")
            print(f"  Aspect: {job['aspectRatio']}")
            input_desc = "composite of Sospiro Vibrato + Le Beau (built + uploaded)" if key == "hero" else "none (text-to-image)"
            print(f"  Input image: {job.get('inputImage') or input_desc}")
            print(f"  Prompt ({len(job['prompt'])} chars):\n    {job['prompt'][:200]}...")
            continue

        # Build composite input for hero
        if key == "hero":
            job["inputImage"] = build_composite_input()

        task_id = submit_job(job, model)
        image_url = poll_until_done(task_id)
        dest = OUTPUT_DIR / job["output"]
        download_image(image_url, dest)

        if key != job_keys[-1]:
            time.sleep(1)

    if not dry_run:
        print(f"\nDone. Images saved to brand-assets/generated/")


def main():
    parser = argparse.ArgumentParser(description="Generate Scent Gallery hero images via KIE Flux Kontext")
    parser.add_argument(
        "--image",
        choices=list(JOBS.keys()) + ["all"],
        default="all",
        help="Which image to generate (default: all)",
    )
    parser.add_argument(
        "--model",
        choices=["pro", "max"],
        default="pro",
        help="Flux Kontext model (default: pro)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print prompts and config without calling the API",
    )
    args = parser.parse_args()

    job_keys = list(JOBS.keys()) if args.image == "all" else [args.image]
    run(job_keys, model=args.model, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
