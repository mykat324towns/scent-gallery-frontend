# Scent Gallery WordPress Theme

A premium WordPress theme built for the Scent Gallery ecommerce store.

## Installation

### Option 1: Direct Clone (Recommended)

```bash
cd wp-content/themes
git clone https://github.com/mykat324towns/Scent-Gallery-Web.git scent-gallery
cd scent-gallery
```

### Option 2: Download & Upload

1. Download the repository as ZIP
2. Unzip and rename to `scent-gallery`
3. Upload to `/wp-content/themes/`

## Activation

1. Log into WordPress Admin
2. Go to **Appearance → Themes**
3. Find "Scent Gallery" and click **Activate**

## Setup

### Set Homepage

1. Go to **Settings → Reading**
2. Under "Your homepage displays", select "Static page"
3. Set the Homepage to your homepage (create one if needed)
4. Save changes

### Enable WooCommerce

- Ensure WooCommerce plugin is installed and activated
- Go to **WooCommerce → Settings** to configure shop page and payment methods

## File Structure

```
scent-gallery/
├── style.css              # Theme header & main styles
├── functions.php          # Theme setup & hooks
├── header.php             # Header template
├── footer.php             # Footer template
├── index.php              # Main template file
├── template-parts/
│   └── homepage.php       # Homepage template
├── inc/
│   ├── woocommerce.php    # WooCommerce integration
│   └── template-tags.php  # Helper functions
└── assets/
    ├── css/               # Stylesheets
    ├── js/                # JavaScript files
    └── img/               # Images & brand assets
```

## Updating

Pull latest changes:

```bash
cd wp-content/themes/scent-gallery
git pull origin main
```

## Support

For issues or changes, visit the [GitHub repository](https://github.com/mykat324towns/Scent-Gallery-Web).
