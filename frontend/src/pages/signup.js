import React, { useState } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Container } from '@mui/material';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [emailError, setEmailError] = useState(false);
    const [passwordError, setPasswordError] = useState(false);

    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setEmailError(false);
        setPasswordError(false);

        if (email === "") {
            setEmailError(true);
        }
        if (password === "") {
            setPasswordError(true);
        }
        if (email && password) {
            try {
                const response = await fetch("http://localhost:4000/v1/signup", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email: email, password: password }),
                });

                const responseData = await response.json();
                if (response.ok) {
                    alert(responseData.message);
                } else {
                    console.error('Error sending data to the backend');
                }
            } catch (error) {
                console.error('An unexpected error occurred:', error);
            }
        }
    }

    return (
        <Container sx={{ height: "100vh", width: "100vw", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <Typography variant="h2">Signup Here</Typography>
            <form noValidate autoComplete='off' onSubmit={handleSubmit} style={{ width: "30vw", marginBottom: "20px" }}>
                <TextField
                    onChange={(e) => setEmail(e.target.value)}
                    sx={{ display: "block", marginTop: "20px", marginBottom: "20px" }}
                    label="Email Address"
                    variant="outlined"
                    color="primary"
                    required
                    fullWidth
                    error={emailError}
                />
                <TextField
                    onChange={(e) => setPassword(e.target.value)}
                    sx={{ display: "block", marginTop: "20px", marginBottom: "20px" }}
                    label="Password"
                    variant="outlined"
                    color="primary"
                    required
                    fullWidth
                    error={passwordError}
                />
                <Button
                    fullWidth
                    variant='contained'
                    color="primary"
                    type='submit'
                >
                    SIGN UP
                </Button>
            </form>
            <Link
                underline="always"
                component="button"
                onClick={() => navigate("/login")}
            >
                Already have an account? Login
            </Link>
        </Container>
    );
}
