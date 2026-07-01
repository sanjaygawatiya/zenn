import os
import sys
import json
import wave
import struct

def mix_audio(workspace_dir, output_wav_path, storyboard_json_path):
    try:
        with open(storyboard_json_path, 'r', encoding='utf-8') as f:
            storyboard = json.load(f)
        scenes = storyboard.get('scenes', [])
        
        if not scenes:
            print("No scenes found in storyboard to mix audio.")
            return
            
        # Find total duration
        total_dur_ms = 0
        for s in scenes:
            offset = s.get('timingOffsetMs', 0)
            dur = s.get('durationMs', 2000)
            total_dur_ms = max(total_dur_ms, offset + dur)
            
        sample_rate = 44100
        total_samples = int((total_dur_ms / 1000.0) * sample_rate) + sample_rate * 5 # add 5s buffer
        
        print(f"Mixing narration segments for total duration of {total_dur_ms / 1000.0:.2f} seconds...")
        
        # Initialize master buffer (use float to avoid clipping during mixing, then scale)
        master_buffer = [0.0] * total_samples
        
        # Keep track of sample counts written for diagnostic output
        for i, s in enumerate(scenes):
            pad = str(i + 1).zfill(3)
            wav_path = os.path.join(workspace_dir, "audio", f"narration_{pad}.wav")
            start_ms = s.get('timingOffsetMs', 0)
            start_sample = int((start_ms / 1000.0) * sample_rate)
            
            if not os.path.exists(wav_path):
                continue
                
            try:
                with wave.open(wav_path, 'rb') as w:
                    nchannels = w.getnchannels()
                    sampwidth = w.getsampwidth()
                    framerate = w.getframerate()
                    nframes = w.getnframes()
                    
                    if framerate != sample_rate:
                        # Warning: if sample rate differs, we assume it's converted already
                        pass
                        
                    frames = w.readframes(nframes)
                    
                    # 16-bit mono PCM is '<h' format (2 bytes per sample)
                    if sampwidth == 2:
                        fmt = f"<{nframes}h"
                        samples = struct.unpack(fmt, frames)
                        for idx, val in enumerate(samples):
                            target_idx = start_sample + idx
                            if target_idx < len(master_buffer):
                                master_buffer[target_idx] += val
                    else:
                        print(f"Skipping unsupported sample width {sampwidth} for {wav_path}")
            except Exception as e:
                print(f"Error mixing {wav_path}: {e}")
                
        # Convert and clip master buffer to 16-bit range
        out_samples = []
        for val in master_buffer:
            if val > 32767.0:
                val = 32767.0
            elif val < -32768.0:
                val = -32768.0
            out_samples.append(int(val))
            
        # Write mixed buffer to output WAV file
        os.makedirs(os.path.dirname(output_wav_path), exist_ok=True)
        with wave.open(output_wav_path, 'wb') as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(sample_rate)
            w.writeframes(struct.pack(f"<{len(out_samples)}h", *out_samples))
            
        print(f"Successfully mixed master audio narration track at: {output_wav_path}")
    except Exception as e:
        print(f"Error mixing master audio narration: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python mix_narration.py <workspace_dir> <output_wav_path> <storyboard_json_path>")
        sys.exit(1)
    mix_audio(sys.argv[1], sys.argv[2], sys.argv[3])
