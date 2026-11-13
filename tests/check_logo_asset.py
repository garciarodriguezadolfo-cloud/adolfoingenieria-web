"""Optional raster-asset regression checks (Pillow/NumPy, no network)."""
from pathlib import Path
from PIL import Image
import numpy as np

root = Path(__file__).resolve().parents[1]
original = Image.open(root / 'assets/branding/original-logo.jpg').convert('RGB')
asset = Image.open(root / 'assets/branding/complete-logo-transparent.png').convert('RGBA')
assert asset.size == original.size == (1280, 765), 'No crop or enlargement of source canvas'
assert asset.convert('RGB').tobytes() == original.tobytes(), 'Only alpha may change'
rgb = np.asarray(original)
alpha = np.asarray(asset)[:, :, 3]
assert not any((alpha[0].any(), alpha[-1].any(), alpha[:, 0].any(), alpha[:, -1].any())), 'No rectangular backdrop'
# The original silver/gold pixels of the A were clipped by the previous mask.
a = rgb[350:447, 700:830]
metal = a.max(axis=2) >= 100
a_alpha = alpha[350:447, 700:830]
assert metal.sum() == 3142
assert (a_alpha[metal] == 255).all(), 'Every source metal pixel in this region must remain visible'
gold = (a[:, :, 0] > 100) & (a[:, :, 1] > 65) & (a[:, :, 2] < a[:, :, 0] * .8)
assert (a_alpha[gold] == 255).all(), 'Retain the original gold detail'
print('OK: original canvas and RGB, transparent perimeter, all 3142 original metal pixels in the A retained')
