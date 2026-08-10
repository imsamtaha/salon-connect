from pathlib import Path
from PIL import Image

root = Path('/home/ubuntu/salon-connect/assets/images')
source = root / 'icon.png'
image = Image.open(source).convert('RGBA')
for filename, size in {
    'icon.png': (1024, 1024),
    'splash-icon.png': (512, 512),
    'favicon.png': (256, 256),
    'android-icon-foreground.png': (432, 432),
}.items():
    output = image.resize(size, Image.Resampling.LANCZOS)
    output.save(root / filename, format='PNG', optimize=True)
