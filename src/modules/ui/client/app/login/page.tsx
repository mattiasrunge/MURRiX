import React from 'react';
import { Link } from 'react-router-dom';
import { LoginForm, LoginMainFooterBandItem, LoginPage } from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';

export default function Login() {
  const [showHelperText, setShowHelperText] = React.useState(false);
  const [username, setUsername] = React.useState('');
  const [isValidUsername, setIsValidUsername] = React.useState(true);
  const [password, setPassword] = React.useState('');
  const [isValidPassword, setIsValidPassword] = React.useState(true);

  const handleUsernameChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setUsername(value);
  };

  const handlePasswordChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setPassword(value);
  };

  const onLoginButtonClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    setIsValidUsername(!!username);
    setIsValidPassword(!!password);
    setShowHelperText(!username || !password);
  };

  const forgotCredentials = (
    <LoginMainFooterBandItem>
      <Link to='./forgot'>Forgot password?</Link>
    </LoginMainFooterBandItem>
  );

  const loginForm = (
    <LoginForm
      showHelperText={showHelperText}
      helperText='Invalid login credentials.'
      helperTextIcon={<ExclamationCircleIcon />}
      usernameLabel='E-Mail'
      usernameValue={username}
      onChangeUsername={handleUsernameChange}
      isValidUsername={isValidUsername}
      passwordLabel='Password'
      passwordValue={password}
      onChangePassword={handlePasswordChange}
      isValidPassword={isValidPassword}
      loginButtonLabel='Log in'
      onLoginButtonClick={onLoginButtonClick}
    />
  );

  return (
    <LoginPage
      loginTitle='Log in'
      loginSubtitle='Enter your credentials.'
      forgotCredentials={forgotCredentials}
    >
      {loginForm}
    </LoginPage>
  );
}
