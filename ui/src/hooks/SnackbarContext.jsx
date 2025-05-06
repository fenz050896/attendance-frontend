import React, { createContext, useState } from 'react';

import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

const snackbarDefaultProps = {
  show: false,
  message: '',
  severity: 'error',
  position: { vertical: 'top', horizontal: 'right' },
  autoHideDuration: 2000,
};

const isObject = (value) =>
  typeof value !== 'undefined' &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  value !== null;

const snackbar422Message = (messages) => {
  const flatMessages = Object.values(messages).reduce(
    (acc, msg) => acc.concat(msg),
    []
  );
  return (
    <ul style={{ margin: 0 }}>
      {flatMessages.map((item, idx) => {
        return <li key={`snackbar-422-msg-${idx}`}>{item}</li>;
      })}
    </ul>
  );
};

export const SnackbarContext = createContext({
  showSnackbar: () => {},
});

export const SnackbarProvider = ({ children }) => {
  const [snackbarProps, setSnackbarProps] = useState({
    ...snackbarDefaultProps,
  });

  const showSnackbar = (props) => {
    if (typeof props.show === 'undefined') props.show = true;
    if (isObject(props) && isObject(props.message)) {
      const error = props.message;
      if (error.response) {
        switch (error.response.status) {
          case 422:
            const messages = error.response.data.invalidFields;
            props.message = snackbar422Message(messages);
            break;
          default:
            props.message =
              error.response.data.message ||
              error.response.data.errorMessage ||
              'Server Error.';
            break;
        }
      } else if (error.request) {
        const msg = error.toJSON();
        props.message = msg.message || 'Request Error';
      } else {
        if (error instanceof Error) {
          props.message = error.toString();
        } else {
          props.message = error || 'Something Wrong';
        }
      }
    }
    setSnackbarProps({ ...snackbarDefaultProps, ...props });
  };
  const handleSnackbarClose = (_, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarProps((prev) => ({
      ...prev,
      show: false,
    }));
  };

  return (
    <>
      <Snackbar
        anchorOrigin={{ ...snackbarProps.position }}
        autoHideDuration={snackbarProps.autoHideDuration}
        open={snackbarProps.show}
        onClose={handleSnackbarClose}
      >
        <Alert
          variant="filled"
          severity={snackbarProps.severity}
          sx={{ width: '100%' }}
        >
          {snackbarProps.message}
        </Alert>
      </Snackbar>
      <SnackbarContext.Provider value={{ showSnackbar }}>
        {children}
      </SnackbarContext.Provider>
    </>
  );
};
