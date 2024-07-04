/* eslint-disable react/no-multi-comp */
import React, { useState, useEffect } from "react";
import { makeStyles } from "@mui/styles";
import { useInterval } from "react-powerhooks";
import theme from '../theme.jsx';

import {
  CircularProgress,
  TextField,
  Button,
  Paper,
  Typography,
} from "@mui/material";

import { useNavigate } from "react-router-dom";

const hrefStyle = {
  color: "#000",
  textDecoration: "none",
};

const bodyDivStyle = {
  margin: "auto",
  padding: '5rem 5rem',
  width: "100%",
  height:'90vh',
  justifyContent:'center',
  display:'flex',
  alignItems: 'center'

};
const content={
  width:'40%',
  paddingLeft:'2rem',
  color:'#AFAFAF',
  fontSize:'1.25rem'

}
const contentContainer={
  width:'70%',
  paddingLeft:'2rem',
  fontSize:'2.2rem',
  lineHeight:'85px'

}
const container={
  width: "100%",
  display:'flex',
}
const left ={
  width: "60%",
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
}
const right={
  width: "40%",
  position:'relative'
}
const imageContainer={
  position: 'absolute',
  left: '-49%',
  top: '-24%'

}
const backImg={
  height:'960px',
  width:'960px'
}
const useStyles = makeStyles({
  notchedOutline: {
    borderColor: "#3949AB !important",
  },
});
const bgImg='images/bg_logo.png'
const LoginDialog = (props) => {
  const {
    globalUrl,
    isLoaded,
    isLoggedIn,
    setIsLoggedIn,
    setCookie,
    register,
    checkLogin,
  } = props;

	let navigate = useNavigate();
  const classes = useStyles();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstRequest, setFirstRequest] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginViewLoading, setLoginViewLoading] = useState(false);
  const [ssoUrl, setSSOUrl] = useState("");

  const [MFAField, setMFAField] = useState(false);
  const [MFAValue, setMFAValue] = useState("");


  // Used to swap from login to register. True = login, false = register

	useEffect(() => {
		checkAdmin() 
	}, [loginViewLoading])

  // Error messages etc
  const [loginInfo, setLoginInfo] = useState("");

  const handleValidateForm = () => {
    return username.length > 1 && password.length > 1;
  };

  if (isLoggedIn === true) {
    //window.location.pathname = "/workflows";
    navigate("/workflows")
  }

  const checkAdmin = () => {
    const url = globalUrl + "/api/v1/checkusers";
    fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) =>
        response.json().then((responseJson) => {
          if (responseJson["success"] === false) {
            setLoginInfo(responseJson["reason"]);
          } else {

            if (responseJson.sso_url !== undefined && responseJson.sso_url !== null) {
              setSSOUrl(responseJson.sso_url);
            }

            if (loginViewLoading) {
              setLoginViewLoading(false);
              checkLogin();
              stop();

              if (
                responseJson.reason !== undefined &&
                responseJson.reason !== null
              ) {
                setLoginInfo(responseJson.reason);
              }
            }

            if (responseJson.reason === "stay") {
              navigate("/adminsetup")
            }
          }
        })
      )
      .catch((error) => {
        if (!loginViewLoading) {
          setLoginViewLoading(true);
          start();
        }
      });
  };

  const { start, stop } = useInterval({
    duration: 3000,
    startImmediate: false,
    callback: () => {
      checkAdmin();
    },
  });

  if (firstRequest) {
    setFirstRequest(false);
    checkAdmin();
  }

  const onSubmit = (e) => {
    setLoginLoading(true);
    e.preventDefault();
    setLoginInfo("");
    // FIXME - add some check here ROFL

    // Just use this one?
    var data = { username: username, password: password };
    if (MFAValue !== undefined && MFAValue !== null && MFAValue.length > 0) {
      data["mfa_code"] = MFAValue;
    }

    var baseurl = globalUrl;
    if (register) {
      var url = baseurl + "/api/v1/login";
      fetch(url, {
        mode: "cors",
        method: "POST",
        body: JSON.stringify(data),
        credentials: "include",
        crossDomain: true,
        withCredentials: true,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      })
        .then((response) =>
          response.json().then((responseJson) => {
            setLoginLoading(false);
            if (responseJson["success"] === false) {
              setLoginInfo(responseJson["reason"]);
            } else {
              if (responseJson["reason"] === "MFA_REDIRECT") {
                setLoginInfo(
                  "MFA required. Please the 6-digit code from your authenticator"
                );
                setMFAField(true);
                return;
              }

              setLoginInfo("Successful login, rerouting");
              for (var key in responseJson["cookies"]) {
                setCookie(
                  responseJson["cookies"][key].key,
                  responseJson["cookies"][key].value,
                  { path: "/" }
                );
              }

			  if (responseJson.tutorials === undefined || responseJson.tutorials === null || !responseJson.tutorials.includes("welcome")) {
			  	console.log("RUN Welcome!!")
			  	window.location.pathname = "/welcome" 
			  	return
			  }

			  const tmpView = new URLSearchParams(window.location.search).get("view")
			  if (tmpView !== undefined && tmpView !== null) {
			  	//const newUrl = `/${tmpView}${decodeURIComponent(window.location.search)}`
			  	const newUrl = `/${tmpView}`
			  	window.location.pathname = newUrl
			  } else {
			  	window.location.pathname = "/workflows"		
			  }

              setIsLoggedIn(true);
            }
          })
        )
        .catch((error) => {
          setLoginLoading(false);
          setLoginInfo("Error logging in: " + error);
        });
    } else {
      url = baseurl + "/api/v1/users/register";
      fetch(url, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) =>
          response.json().then((responseJson) => {
            if (responseJson["success"] === false) {
              setLoginInfo(responseJson["reason"]);
            } else {
              setLoginInfo("Successful register!");
            }
          })
        )
        .catch((error) => {
          setLoginInfo("Error in from backend: ", error);
        });
    }
  };

  const onChangeUser = (e) => {
    setUsername(e.target.value);
  };

  const onChangePass = (e) => {
    setPassword(e.target.value);
  };

  //const onClickRegister = () => {
  //	if (props.location.pathname === "/login") {
  //		window.location.pathname = "/register"
  //	} else {
  //		window.location.pathname = "/login"
  //	}

  //	setLoginCheck(!register)
  //}

  //var loginChange = register ? (<div><p onClick={setLoginCheck(false)}>Want to register? Click here.</p></div>) : (<div><p onClick={setLoginCheck(true)}>Go back to login? Click here.</p></div>);
  var formtitle = register ? <div style={{  color:'#000 !important'
  }}>Welcome Back</div> : <div style={{  color:'#000 !important'
  }}>Register</div>;
  const imgsize = 100;
  const basedata = (
   <div style={bodyDivStyle} >
    <div style={container}>
      <div style={left}>
      <div style={contentContainer}>
  <h1 style={{  marginBottom:0 
}}>Login into
  your account</h1>
</div >
        <div style={content}>
<p>Find new ways to automate by discovering usecases made by Shufflers</p>
        </div>

      </div>
      <div style={right}>
      <div
         style={imageContainer}
        >
          <img
            src={bgImg}
            style={backImg}
          />
        </div>
      <Paper
        style={{
          paddingLeft: "30px",
          paddingRight: "30px",
          paddingBottom: "30px",
          paddingTop: "30px",
          position: "relative",
          backgroundColor: '#ffffff',
          height: '535px',
    width: '87%',
    borderRadius:'24px'
        }}
      >
        

        {loginViewLoading ? (
          <div style={{ textAlign: "center", marginTop: 50 }}>
            <Typography
              variant="body2"
              style={{ marginBottom: 20, color: "#000" }}
            >
              Waiting for the Shuffle database to become available. This may
              take up to a minute.
            </Typography>

            {loginInfo === undefined ||
            loginInfo === null ||
            loginInfo.length === 0 ? null : (
              <div style={{ marginTop: "10px" }}>Database Response: {loginInfo}</div>
            )}
            <CircularProgress color="secondary" style={{ color: "#000" }} />

            <Paper
              style={{
                paddingLeft: "30px",
                paddingRight: "30px",
                paddingBottom: "30px",
                paddingTop: "30px",
                position: "relative",
                textAlign: "left",
                marginTop: 15,
              }}
            >
              <Typography
                variant="body2"
                style={{ marginBottom: 20, color: "#000" }}
              >
                <b>
                  Are you sure Shuffle is{" "}
                  <a
                    rel="norefferer"
                    target="_blank"
                    href="https://github.com/frikky/Shuffle/blob/master/.github/install-guide.md"
                    style={{ textDecoration: "none", color: "#f86a3e" }}
                  >
                    installed correctly
                  </a>
                  ?
                </b>
              </Typography>
              <Typography
                variant="body2"
                style={{ marginBottom: 20, color: "#000" }}
              >
                <b>1.</b> Make sure shuffle-database folder has correct access, and that you have a minimum of <b>2Gb of RAM available</b>:{" "}
                <br />
                <br />
                sudo chown -R 1000:1000 shuffle-database
              </Typography>
              <Typography
                variant="body2"
                style={{ marginBottom: 20, color: "#000" }}
              >
                <b>2.</b> Disable memory swap on the host:
                <br />
                <br />
				sudo swapoff -a
              </Typography>
              <Typography
                variant="body2"
                style={{ marginBottom: 20, color: "#000" }}
              >
                <b>3</b>. Restart the database:
                <br />
                <br />
                sudo docker restart shuffle-opensearch
              </Typography>
            </Paper>
            <Typography
              variant="body2"
              style={{ marginBottom: 10, color: "#000", marginTop: 20 }}
            >
              Need help?{" "}
              <a
                rel="norefferer"
                target="_blank"
                href="https://discord.gg/B2CBzUm"
                style={{ textDecoration: "none", color: "#f86a3e" }}
              >
                Join the Discord!
              </a>
            </Typography>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            style={{ margin: "15px 15px 15px 15px", color: "#000" }}
          >
            <h2 >{formtitle}</h2>
            Enter your username or email address
            <div style={{ paddingBottom:'1rem'}}>
              <TextField
                color="primary"
                style={{
                  marginTop: 5,
                }}
                autoFocus
                InputProps={{
                  classes: {
                    notchedOutline: classes.notchedOutline,
                  },
                  style: {
                    height: "57px",
                    color: "#000",
                    fontSize: "1em",
                  },
                }}
                required
                fullWidth={true}
                autoComplete="username"
                placeholder="username@example.com"
                id="emailfield"
                margin="normal"
                variant="outlined"
                onChange={onChangeUser}
              />
            </div>
            Enter your Password
            <div style={{ paddingBottom:'1rem'}}>
              <TextField
                color="primary"
                style={{
                  marginTop: 5,
                }}
                InputProps={{
                  classes: {
                    notchedOutline: classes.notchedOutline,
                  },
                  style: {
                    height: "57px",
                    color: "#000",
                    fontSize: "1em",
                  },
                }}
                required
                id="outlined-password-input"
                fullWidth={true}
                type="password"
                autoComplete="current-password"
                placeholder="**********"
                margin="normal"
                variant="outlined"
                onChange={onChangePass}
              />
            </div>
            {MFAField === true ? (
              <div style={{ marginTop: 15 }}>
                2-factor code
                <TextField
                  color="primary"
                  style={{
                    marginTop: 5,
                  }}
                  InputProps={{
                    classes: {
                      notchedOutline: classes.notchedOutline,
                    },
                    style: {
                      height: "57px",
                      color: "#000",
                      fontSize: "1em",
                    },
                  }}
                  required
                  id="outlined-password-input"
                  fullWidth={true}
                  type="text"
                  placeholder="6-digit code"
                  margin="normal"
                  variant="outlined"
                  onChange={(event) => {
                    setMFAValue(event.target.value);
                  }}
                />
              </div>
            ) : null}
            <div style={{ display: "flex", marginTop: "15px" }}>
              <Button
                color="primary"
                variant="contained"
                type="submit"
                style={{ flex: "1", background:'#3949AB',color: "#fff",   height: "57px", }}
                disabled={!handleValidateForm() || loginLoading}
              >
                {loginLoading ? (
                  <CircularProgress
                    color="secondary"
                    style={{ color: "#fff" }}
                  />
                ) : (
                  "SUBMIT"
                )}
              </Button>
            </div>
            <div style={{ marginTop: "10px" }}>{loginInfo}</div>
            {ssoUrl !== undefined && ssoUrl !== null && ssoUrl.length > 0 ? (
              <div>
                <Typography style={{ textAlign: "center" }}>Or</Typography>
                <div style={{ textAlign: "center", margin: 10 }}>
                  <Button
                    fullWidth
										id="sso_button"
                    color="secondary"
                    variant="outlined"
                    type="button"
                    style={{ flex: "1", marginTop: 5 }}
                    onClick={() => {
                      //console.log("CLICK SSO");
											window.location.href = ssoUrl
                      //navigate(ssoUrl)
                    }}
                  >
                    Use SSO
                  </Button>
                </div>
              </div>
            ) : null}
          </form>
        )}
      </Paper>
 
      </div>
    </div>
   </div>
  );

  const loadedCheck = isLoaded ? <div>{basedata}</div> : <div></div>;

	useEffect(() => {
		setTimeout(() => {
			if (ssoUrl !== undefined && ssoUrl !== null && ssoUrl.length > 0) {
				//id="sso_button"
    		const ssoBtn = document.getElementById("sso_button");
				if (ssoBtn !== undefined && ssoBtn !== null) {
					//console.log("SSO BTN: ", ssoBtn)
					const cursearch = typeof window === "undefined" || window.location === undefined ? "" : window.location.search;
					var tmpView = new URLSearchParams(cursearch).get("autologin");
					if (tmpView !== undefined && tmpView !== null) {
						if (tmpView === "true") {
							console.log("Tmp: ", tmpView)
							ssoBtn.click()
						}
					}
				}
			}
		}, 200);
	}, [ssoUrl])

  return <div style={{ }}>{loadedCheck}</div>;
};

export default LoginDialog;
