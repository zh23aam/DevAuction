import axios from 'axios';
import api from '../../utils/api';

const AudioRecorder = () => {
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        audioChunksRef.current = [];  // Clear the chunks for the next recording
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      setMediaRecorder(null);
      setIsRecording(false);
    }
  };

  const handleRecordButtonClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSendAudio = async () => {
    if (audioURL) {
      // Use axios for local blob fetching to be consistent with "replace fetch with axios"
      const { data: audioBlob } = await axios.get(audioURL, { responseType: 'blob' });
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.wav');

      try {
        await api.post('/chat/audio', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        console.log('Audio sent successfully');
      } catch (err) {
        console.error('Error sending audio:', err);
      }
    }
  };

  return (
    <div className="audio-recorder">
      <button
        onClick={handleRecordButtonClick}
        className={`record-button ${isRecording ? 'recording' : ''}`}
      >
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
      <button onClick={handleSendAudio} className="send-button">
        Send Recording
      </button>
      {audioURL && (
        <audio controls src={audioURL} ref={audioRef}>
          Your browser does not support the audio element.
        </audio>
      )}
    </div>
  );
};

export default AudioRecorder;
