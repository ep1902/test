import * as React from "react";
import Avatar from "@mui/material/Avatar";

import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import RadioGroup from "@mui/material/RadioGroup";
import Radio from "@mui/material/Radio";
import FormControlLabel from "@mui/material/FormControlLabel";
import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";

import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import { Paper } from "@mui/material";
import dataController from "../utils/DataController";

import { useNavigate } from "react-router-dom";
import "../styles/register.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function RegisterPage() {
  const navigate = useNavigate();
  const dc = new dataController();

  const handleSubmit = (event) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);

    const loginData = {
      username: data.get("username"),
      email: data.get("email"),
      password: data.get("password"),
      firstName: data.get("firstName"),
      lastName: data.get("lastName"),
      roleId: data.get("role") === "Teacher" ? 1 : 0,
    };

    if (data.get("role") === "Teacher" && data.get("teacherName") !== "") {
      loginData.teacherName = data.get("username");
    }

    dc.PostData(API_BASE + "/", loginData)
      .then((resp) => {
        if (resp.success === true && resp.data.success === true) {
          setTimeout(() => {
            navigate("/login");
          }, 300);
        }
      })
      .catch((resp) => {
        console.log(resp);
      });
  };

  return (
    <div className="register-page">
      <CssBaseline />

      <Grid container className="register-grid">
        <Grid item xs={12} sm={8} md={6} lg={4}>
          <Paper
            component="form"
            onSubmit={handleSubmit}
            className="register-card"
            elevation={8}
            square={false}
          >
            <Avatar className="register-avatar">
              <LockOutlinedIcon />
            </Avatar>

            <Typography component="h1" variant="h5" className="register-title">
              Sign up
            </Typography>

            <RadioGroup
              aria-label="role"
              name="role"
              defaultValue="Student"
              className="register-role"
            >
              <FormControlLabel
                value="Student"
                control={<Radio />}
                label="Student"
              />
              <FormControlLabel
                value="Teacher"
                control={<Radio />}
                label="Teacher"
              />
            </RadioGroup>

            <Grid container spacing={2} className="register-fields">
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="firstName"
                  label="First Name"
                  name="firstName"
                  autoComplete="given-name"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  autoComplete="family-name"
                />
              </Grid>
            </Grid>
            <Grid container spacing={2} className="register-fields">
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="username"
                  label="Username"
                  name="username"
                  autoComplete="username"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  type="email"
                />
              </Grid>
            </Grid>
            <Grid container spacing={2} className="register-fields">
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="password"
                  label="Password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              className="register-submit"
            >
              Sign Up
            </Button>

            <div className="register-footer">
              <Link href="/login" variant="body2" underline="hover">
                Already have an account? Sign in
              </Link>
            </div>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
}
