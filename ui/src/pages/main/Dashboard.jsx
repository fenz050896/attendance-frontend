import React, { useState } from 'react';
// import dayjs from 'dayjs';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';

function createData(name, calories, fat, carbs, protein) {
  return { name, calories, fat, carbs, protein };
}

const rows = [
  createData('Frozen yoghurt', 159, 6.0, 24, 4.0),
  createData('Ice cream sandwich', 237, 9.0, 37, 4.3),
  createData('Eclair', 262, 16.0, 24, 6.0),
  createData('Cupcake', 305, 3.7, 67, 4.3),
  createData('Gingerbread', 356, 16.0, 49, 3.9),
];

function DashboardPage() {
  const [date, setDate] = useState(null);
  const [tablePaginationProps, setTablePaginationProps] = useState({
    page: 0,
    rowsPerPage: 3,
  });
  const visibleRows = React.useMemo(() => {
    return rows.slice(
      tablePaginationProps.page * tablePaginationProps.rowsPerPage,
      tablePaginationProps.page * tablePaginationProps.rowsPerPage +
        tablePaginationProps.rowsPerPage
    );
  }, [tablePaginationProps]);

  const handleChangePage = (event, newPage) => {
    setTablePaginationProps({ ...tablePaginationProps, page: newPage });
  };
  const handleChangeRowsPerPage = (event) => {
    setTablePaginationProps({
      ...tablePaginationProps,
      rowsPerPage: parseInt(event.target.value, 10),
      page: 0,
    });
  };
  const handleDateChange = (v) => {
    console.log(v);
    setDate(v);
  };

  return (
    <Grid container rowSpacing={2}>
      <Grid size={12}>
        <Stack spacing={2}>
          <Typography variant="h6">Filter :</Typography>
          <Box display="flex">
            <DatePicker
              value={date}
              onChange={handleDateChange}
              label="Bulan dan Tahun"
              views={['month', 'year']}
              slotProps={{
                textField: { size: 'small' },
              }}
              sx={{ marginInlineEnd: 2 }}
            />
            <Button variant="contained" color="secondary">
              Terapkan
            </Button>
          </Box>
        </Stack>
      </Grid>
      <Grid size={12}>
        <Card sx={{ width: '100%' }}>
          <CardContent>
            <TableContainer>
              <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell>Dessert (100g serving)</TableCell>
                    <TableCell align="right">Calories</TableCell>
                    <TableCell align="right">Fat&nbsp;(g)</TableCell>
                    <TableCell align="right">Carbs&nbsp;(g)</TableCell>
                    <TableCell align="right">Protein&nbsp;(g)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleRows.map((row) => (
                    <TableRow
                      key={row.name}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {row.name}
                      </TableCell>
                      <TableCell align="right">{row.calories}</TableCell>
                      <TableCell align="right">{row.fat}</TableCell>
                      <TableCell align="right">{row.carbs}</TableCell>
                      <TableCell align="right">{row.protein}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[3, 6, 12]}
              component="div"
              count={rows.length}
              rowsPerPage={tablePaginationProps.rowsPerPage}
              page={tablePaginationProps.page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default DashboardPage;
