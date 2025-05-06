import React from 'react';
import { Link as RouterLink } from 'react-router';
import { lightBlue } from '@mui/material/colors';

import Typography from '@mui/material/Typography';

function Link({ children, to }) {
  return (
    <Typography
      component={RouterLink}
      variant="caption"
      to={to}
      sx={{
        fontSize: '0.8rem',
        color: lightBlue[600],
        textDecoration: 'none',
        ':hover': {
          color: 'blue',
          textDecoration: 'underline',
        },
      }}
    >
      {children}
    </Typography>
  );
}

export default Link;
