import os
import sys
import json
import wave
import struct
from PIL import Image, ImageFilter, ImageOps

def pencil_sketch(img_path, out_path):
    try:
        img = Image.open(img_path)
        # Convert to grayscale
        gray = img.convert('L')
        # Invert the grayscale image
        inverted = ImageOps.invert(gray)
        # Apply Gaussian Blur (radius 15 for soft sketch lines)
        blur = inverted.filter(ImageFilter.GaussianBlur(15))
        
        # Color dodge blend: (gray * 256) / (255 - blur)
        width, height = gray.size
        gray_pixels = list(gray.getdata())
        blur_pixels = list(blur.getdata())
        
        sketch_pixels = []
        for g, b in zip(gray_pixels, blur_pixels):
            denom = 255 - b
            if denom == 0:
                val = 255
            else:
                val = min(255, (g * 256) // denom)
            sketch_pixels.append(val)
            
        sketch_img = Image.new('L', (width, height))
        sketch_img.putdata(sketch_pixels)
        
        # Add high-contrast thresholding for authentic ink/pencil hand-drawn sketch look
        # Keeping some smooth gradients makes it look like pencil shading!
        sketch_img.save(out_path)
    except Exception as e:
        print(f"Error processing sketch for {img_path}: {e}")

def process_all_keyframes(out_dir):
    keyframes_dir = os.path.join(out_dir, "reference_keyframes")
    sketches_dir = os.path.join(out_dir, "reference_sketches")
    os.makedirs(sketches_dir, exist_ok=True)
    
    if not os.path.exists(keyframes_dir):
        print(f"Keyframes directory {keyframes_dir} does not exist.")
        return
        
    files = sorted([f for f in os.listdir(keyframes_dir) if f.endswith(".png")])
    print(f"Converting {len(files)} keyframes into pencil sketch outlines...")
    for idx, f in enumerate(files):
        img_path = os.path.join(keyframes_dir, f)
        out_path = os.path.join(sketches_dir, f)
        pencil_sketch(img_path, out_path)
        if (idx + 1) % 20 == 0 or idx == len(files) - 1:
            print(f"Processed {idx + 1}/{len(files)} sketch outlines...")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python pencil_sketch.py <out_dir>")
        sys.exit(1)
    process_all_keyframes(sys.argv[1])
