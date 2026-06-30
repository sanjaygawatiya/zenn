import subprocess
import json
import sys
import os

ffprobe_path = 'C:/Users/sanja/AppData/Local/Programs/Python/Python314/Lib/site-packages/static_ffmpeg/bin/win32/ffprobe.exe'
ffmpeg_path = 'C:/Users/sanja/AppData/Local/Programs/Python/Python314/Lib/site-packages/static_ffmpeg/bin/win32/ffmpeg.exe'

def analyze_reference(video_path, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    os.makedirs(os.path.join(out_dir, "reference_keyframes"), exist_ok=True)
    
    # 1. Get keyframe timestamps
    cmd = [
        ffprobe_path, '-v', 'error',
        '-skip_frame', 'nokey',
        '-select_streams', 'v:0',
        '-show_entries', 'frame=pts_time',
        '-of', 'csv=print_section=0',
        video_path
    ]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    
    raw_timestamps = []
    for line in result.stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            val = float(line.replace(',', '').strip())
            raw_timestamps.append(val)
        except ValueError:
            continue
            
    # Sort and filter duplicates
    raw_timestamps.sort()
    timestamps = []
    for t in raw_timestamps:
        if not timestamps or t - timestamps[-1] > 0.5:
            timestamps.append(t)

    # Ensure 0.0 is the first timestamp
    if not timestamps or timestamps[0] > 0.1:
        timestamps.insert(0, 0.0)
        
    # 2. Extract keyframes as image files using FFmpeg at keyframe timestamps
    for idx, ts in enumerate(timestamps):
        out_img = os.path.join(out_dir, "reference_keyframes", f"keyframe_{idx + 1:03d}.png")
        extract_cmd = [
            ffmpeg_path, '-y',
            '-ss', str(ts),
            '-i', video_path,
            '-vframes', '1',
            out_img
        ]
        subprocess.run(extract_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
    # Calculate durations of estimated scenes
    scene_durations = []
    for i in range(len(timestamps) - 1):
        scene_durations.append(timestamps[i+1] - timestamps[i])
        
    # For the last scene, get video duration
    duration_cmd = [
        ffprobe_path, '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        video_path
    ]
    tot_dur_sec = float(subprocess.run(duration_cmd, stdout=subprocess.PIPE, text=True).stdout.strip())
    if timestamps:
        scene_durations.append(max(1.0, tot_dur_sec - timestamps[-1]))
        
    # Write analysis report
    report = {
        "success": True,
        "totalDurationSec": tot_dur_sec,
        "keyframeTimestamps": timestamps,
        "sceneDurations": scene_durations,
        "sceneCount": len(timestamps)
    }
    
    with open(os.path.join(out_dir, "reference_segmentation.json"), "w") as f:
        json.dump(report, f, indent=2)
        
    print(f"Reference video analyzed successfully. Found {len(timestamps)} scenes.")
    return report

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python analyze_reference.py <video_path> <out_dir>")
        sys.exit(1)
    analyze_reference(sys.argv[1], sys.argv[2])
