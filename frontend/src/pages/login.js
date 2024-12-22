import React, { useState } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Container } from '@mui/material';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import { useNavigate } from 'react-router-dom';


export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [emailError, setEmailError] = useState(false);
    const [passwordError, setPasswordError] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
      e.preventDefault();
      setEmailError(false);
      setPasswordError(false);

      // A lil validation
      if (email === "") {
        setEmailError(true);
      }
      if (password === "") {
        setPasswordError(true);
      }
      if (email && password) {
        try {
          // send data to backend; let login route handle it accordingly
          const response = await fetch("http://localhost:4000/v1/login", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email, password: password }),
          });
          const responseData = await response.json();
          console.log("The token is : ", responseData.token);
          if (response.status === 401) { //User is not registered
            alert(responseData.message);
          }
          if (response.ok) { // successful login, must produce notes page of the user, done via view route
            // storing the token in local storage
            localStorage.setItem("myToken", responseData.token);
            const myProtected = localStorage.getItem("myToken");
            //return <Notes token={myProtected} />; // this line doesn't work as i thought, I don't think this is the way to do it, we gotta figure out a way to redirect user to notes page
            navigate("/all-machines");
            window.location.reload(); // Force page refresh
          }
        }
        catch(error) {
          console.error('An unexpected error occured:', error);
        }
      }
    }
    return (
        <Container sx = {{height: "100vh", width: "100vw", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"}}>
            <Typography variant="h2">Login Here</Typography>
            <form noValidate autoComplete='off' onSubmit = {handleSubmit} style={{width: "30vw", marginBottom: "20px"}}>
              <TextField
                onChange={(e) => setEmail(e.target.value)}
                sx = {{display: "block", marginTop: "20px", marginBottom: "20px"}}
                label="Email Address" 
                variant="outlined"
                color="primary"
                required // adds an asterick
                fullWidth
                error={emailError}
              />
              <TextField
                onChange={(e) => setPassword(e.target.value)}
                sx = {{display: "block", marginTop: "20px", marginBottom: "20px"}}
                label="Password"
                variant="outlined"
                color="primary"
                required // adds an asterick
                fullWidth
                error={passwordError}
              />
              <Button
                fullWidth
                variant='contained'
                color="primary"
                type='submit'
              >
                Login
              </Button>
            </form>
            <Link
             underline="always"
             component="button"
             onClick={() => navigate("/signup")}
            >
            Don't have an account? Sign Up
            </Link>
        </Container>
    );
}