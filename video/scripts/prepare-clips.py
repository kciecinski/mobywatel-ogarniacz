import subprocess
clips=[('start',2.0,4.2,4),('data',6.2,10.4,8),('usc',16.6,8.0,8),('zus',24.6,7.0,9),('thread',3.15,5,5)]
for name,start,length,out in clips:
 source='assets/thread.webm' if name=='thread' else 'assets/product.mp4'
 cmd=['ffmpeg','-y','-ss',str(start),'-i',source,'-t',str(length),'-vf',f'setpts=(PTS-STARTPTS)*{out/length},fps=30','-c:v','libx264','-crf','16','-pix_fmt','yuv420p','-an','-movflags','+faststart',f'assets/{name}.mp4']
 subprocess.run(cmd,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 print('Prepared',name,flush=True)
subprocess.run(['ffmpeg','-y','-i','assets/screens/overview.png','-vf','crop=860:360:90:175','-frames:v','1','assets/screens/finished-card.png'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
