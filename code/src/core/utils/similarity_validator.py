import subprocess
import json
import sys
import os
from PIL import Image
import numpy as np

ffmpeg_path = 'C:/Users/sanja/AppData/Local/Programs/Python/Python314/Lib/site-packages/static_ffmpeg/bin/win32/ffmpeg.exe'

def compute_similarity(ref_img_path, gen_img_path):
    try:
        # Load and convert to grayscale for spatial comparison (NCC)
        img1 = Image.open(ref_img_path).convert('L').resize((32, 32))
        img2 = Image.open(gen_img_path).convert('L').resize((32, 32))
        
        a1 = np.array(img1, dtype=np.float32)
        a2 = np.array(img2, dtype=np.float32)
        
        std1 = a1.std()
        std2 = a2.std()
        
        if std1 < 1e-3 or std2 < 1e-3:
            # Flat color images matching check
            ncc = 1.0 if abs(a1.mean() - a2.mean()) < 5.0 else 0.0
        else:
            ncc = ((a1 - a1.mean()) * (a2 - a2.mean())).mean() / (std1 * std2)
            
        ncc_score = (ncc + 1.0) / 2.0 * 100.0
        
        # Load and compute RGB histogram correlation (color composition)
        img1_c = Image.open(ref_img_path).convert('RGB')
        img2_c = Image.open(gen_img_path).convert('RGB')
        
        h1 = np.array(img1_c.histogram(), dtype=np.float32)
        h2 = np.array(img2_c.histogram(), dtype=np.float32)
        
        norm1 = np.linalg.norm(h1)
        norm2 = np.linalg.norm(h2)
        
        if norm1 < 1e-3 or norm2 < 1e-3:
            hist_score = 0.0
        else:
            cos_sim = np.dot(h1, h2) / (norm1 * norm2)
            hist_score = cos_sim * 100.0
            
        # Combine structural and color similarity (40% structural, 60% color)
        final_score = 0.4 * ncc_score + 0.6 * hist_score
        return float(round(max(0.0, min(100.0, final_score)), 2))
    except Exception as e:
        print(f"Error comparing images: {e}")
        return 0.0

def run_validation(ref_dir, gen_video_path, segmentation_json_path, out_json_path):
    with open(segmentation_json_path, 'r') as f:
        seg = json.load(f)
        
    timestamps = seg.get("keyframeTimestamps", [])
    if not timestamps:
        print("No timestamps found in segmentation file.")
        return

    # Filter timestamps to generated video duration
    duration_cmd = [
        ffmpeg_path.replace('ffmpeg.exe', 'ffprobe.exe'), '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        gen_video_path
    ]
    try:
        gen_dur = float(subprocess.run(duration_cmd, stdout=subprocess.PIPE, text=True).stdout.strip())
        timestamps = [t for t in timestamps if t < gen_dur]
    except Exception as e:
        print(f"Error querying generated video duration: {e}")
        
    gen_keyframes_dir = os.path.join(os.path.dirname(out_json_path), "generated_keyframes")
    os.makedirs(gen_keyframes_dir, exist_ok=True)
    
    comparisons = []
    total_score = 0.0
    
    for idx, ts in enumerate(timestamps):
        ref_img_path = os.path.join(ref_dir, "reference_keyframes", f"keyframe_{idx + 1:03d}.png")
        gen_img_path = os.path.join(gen_keyframes_dir, f"frame_{idx + 1:03d}.png")
        
        # Extract frame from generated video at timestamp
        extract_cmd = [
            ffmpeg_path, '-y',
            '-ss', str(ts),
            '-i', gen_video_path,
            '-vframes', '1',
            gen_img_path
        ]
        subprocess.run(extract_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Compare images if both exist
        if os.path.exists(ref_img_path) and os.path.exists(gen_img_path):
            score = compute_similarity(ref_img_path, gen_img_path)
            comparisons.append({
                "sceneIndex": idx + 1,
                "timestampSec": ts,
                "similarityPercent": score
            })
            total_score += score
            print(f"Scene {idx + 1} similarity: {score}%")
        else:
            comparisons.append({
                "sceneIndex": idx + 1,
                "timestampSec": ts,
                "similarityPercent": 0.0,
                "error": "Missing keyframe files"
            })
            
    avg_score = float(round(total_score / len(comparisons), 2)) if comparisons else 0.0
    
    report = {
        "success": True,
        "averageSimilarityPercent": avg_score,
        "comparisons": comparisons
    }
    
    with open(out_json_path, 'w') as f:
        json.dump(report, f, indent=2)
        
    print(f"Visual similarity validation complete. Average similarity: {avg_score}%")

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print("Usage: python similarity_validator.py <ref_dir> <gen_video_path> <segmentation_json> <out_json_path>")
        sys.exit(1)
        
    run_validation(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])
