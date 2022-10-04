import { Box, Button, Center, Divider, Input, Progress } from "@chakra-ui/react";
import axios from "axios";

import React, { Component } from "react";
import ReactDOM from 'react-dom/client'
import { ChakraProvider, theme } from '@chakra-ui/react'

class App extends Component {
  state = {
    // Initially, no file is selected
    selectedFile: null,
  };

  // On file select (from the pop up)
  onFileChange = (event) => {
    // Update the state
    this.setState({ selectedFile: event.target.files[0] });
  };

  // On file upload (click the upload button)
  onFileUpload = () => {
    // Create an object of formData
    const formData = new FormData();

    // Update the formData object
    formData.append("file", this.state.selectedFile, "example.csv");

    // Details of the uploaded file
    console.log(this.state.selectedFile);

    // Request made to the backend api
    // Send formData object
    console.log(formData);
    axios.defaults.headers.post["Access-Control-Allow-Origin"] = "*";
    axios
      .post("http://localhost:8000/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
		onUploadProgress: (progressEvent) => {
			ReactDOM.createRoot(document.getElementById('root')).render(
				<React.StrictMode>
				  <ChakraProvider theme={theme}>
				  <Progress size='xs' isIndeterminate />
				  </ChakraProvider>
				</React.StrictMode>,
			  )
		}
      })
      .then((resp) => {
        let result = resp.data;
        console.log(result);
        alert(result.message);
		location.reload()
      });
  };

  // File content to be displayed after
  // file upload is complete
  fileData = () => {
    if (this.state.selectedFile) {
      return (
        <div>
          <h2>File Details:</h2>

          <p>File Name: {this.state.selectedFile.name}</p>

          <p>File Type: {this.state.selectedFile.type}</p>

          <p>
            Last Modified:{" "}
            {this.state.selectedFile.lastModifiedDate.toDateString()}
          </p>
        </div>
      );
    } else {
      return <div></div>;
    }
  };

  render() {
    return (
      <>
        <Center>
          <Box
            maxW="sm"
            borderWidth="1px"
            borderRadius="lg"
            overflow="hidden"
            padding={5}
            marginTop={10}
          >
            <div>
              <Center>
                <h1>Subir archivo csv</h1>
              </Center>

              <div>
                <Input
                  type={"file"}
                  onChange={this.onFileChange}
                  marginTop={5}
                />
                {/* <input type="file" onChange={this.onFileChange} /> */}
                <Center marginTop={5}>
                  <Button onClick={this.onFileUpload}>Enviar</Button>
                </Center>
              </div>
              {this.fileData()}
            </div>
          </Box>
        </Center>
      </>
    );
  }
}

export default App;
