 nodejs index.js

- enregistrement sox:
sox -t alsa default input.wav silence 1 0.1 5% 1 5 1%

- faire des tests avec des fichiers de qq secondes
perl audio_chromaprint_diff.pl input.wav input2.wav
