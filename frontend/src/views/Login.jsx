import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import { Paper } from "@mui/material";
import dataController from "../utils/DataController";

import { Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import { useState } from "react";
import "../styles/login.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function Login(props) {
  const [error, setError] = useState([false, false]);

  const navigate = useNavigate();
  const dc = new dataController();

  const handleSubmit = (event) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);

    if (data.get("username") === "") {
      setError([true, error[1]]);
    }
    if (data.get("password") === "") {
      setError([error[0], true]);
    }
    if (data.get("username") === "" || data.get("password") === "") {
      return;
    }

    const loginData = {
      username: data.get("username"),
      password: data.get("password"),
    };

    dc.PostData(API_BASE + "/login", loginData)
      .then((resp) => {
        if (resp.success === true && resp.data.success === true) {
          localStorage.setItem("auth_token", resp.data.data.access_token);
          localStorage.setItem("roleId", resp.data.data.user.roleId);
          if (resp.data.data.user.roleId === 1) {
            navigate("/home");
          } else {
            navigate("/student/home");
          }
        } else {
          setError([false, false]);
        }
      })
      .catch((resp) => {
        setError([false, false]);
      });
  };

  return (
    <div className="login-page">
      <CssBaseline />

      <Grid container className="login-grid">
        <Grid item xs={12} sm={8} md={6} lg={4}>
          <Paper className="login-card" elevation={8} square={false}>
            <Box
              component="form"
              noValidate
              onSubmit={handleSubmit}
              className="login-form"
            >
              <Avatar className="login-avatar">
                <LockOutlinedIcon />
              </Avatar>

              <Typography component="h1" variant="h5" className="login-title">
                Sign in
              </Typography>

              <Typography variant="body2" className="login-subtitle">
                Welcome back. Please enter your credentials.
              </Typography>

              <div className="login-fields">
                <TextField
                  required
                  fullWidth
                  name="username"
                  label="Username"
                  id="username"
                  autoComplete="username"
                />

                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                className="login-submit"
              >
                Sign in
              </Button>

              <div className="login-footer">
                <Link href="/" variant="body2" underline="hover">
                  Don't have an account? Register
                </Link>
              </div>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
}
