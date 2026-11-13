"""Optional asset preparation only; not used by the site build or at runtime.

Remove the background from the supplied complete raster logo without changing
its canvas, RGB pixels, element positions, or original footer asset.
Requires Pillow, NumPy and SciPy in the image-processing environment.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
image = Image.open(ROOT / 'assets/branding/original-logo.jpg').convert('RGBA')
mask = Image.new('L', image.size)
draw = ImageDraw.Draw(mask)
# Clipping contours retain the dark parts of the existing geometric elements.
# They do not draw or replace logo pixels; all colour comes from the JPEG.
contours = [
    [(437,341),(598,83),(695,217),(669,255),(603,168),(497,341)],
    [(625,340),(791,73),(969,341),(918,341),(792,147),(674,340)],
    [(727,340),(754,291),(856,290),(886,340)],
    [(203,440),(255,358),(283,399),(313,359),(366,439),(340,439),(314,396),(287,439),(264,439),(278,417),(258,393),(228,440)],
    [(708,439),(765,359),(821,439),(794,439),(765,394),(738,439)],
    [(744,439),(757,419),(775,419),(789,439)],
]
for contour in contours:
    draw.polygon(contour, fill=255)
mask = mask.filter(ImageFilter.MaxFilter(3))
rgb = np.asarray(image.convert('RGB'))
alpha = np.array(mask)
# Text and rule: retain connected foreground pixels and their original edge.
regions = [(367,379,666,443),(823,378,1125,443),(289,456,1054,505),
           (452,525,882,548),(342,561,996,612),(432,619,905,659)]
for left, top, right, bottom in regions:
    foreground = rgb[top:bottom,left:right].max(axis=2) > 65
    labels, _ = ndimage.label(foreground)
    sizes = np.bincount(labels.ravel())
    foreground = (sizes[labels] >= 3) & (labels > 0)
    foreground = ndimage.binary_dilation(foreground, iterations=1)
    alpha[top:bottom,left:right] = np.maximum(
        alpha[top:bottom,left:right], foreground.astype('uint8') * 255)
image.putalpha(Image.fromarray(alpha))
assert image.convert('RGB').tobytes() == rgb.tobytes()
image.save(ROOT / 'assets/branding/complete-logo-transparent.png', optimize=True)
