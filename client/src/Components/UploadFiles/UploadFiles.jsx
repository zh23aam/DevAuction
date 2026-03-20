import api from '../../utils/api';

function UploadFiles() {
  
  const [file, setFile] = useState()
  const upload = () => {
    const formData = new FormData()
    formData.append('file', file)
    api.post('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then(response => {console.log(response)})
      .catch(error => console.log(error))
  }

  return (
    <div>
      <input type="file" onChange={(e)=> setFile(e.target.files[0])} />
      <button type="button" onClick={upload} >Upload</button>
    </div>
  );
}

export default UploadFiles;
