'use constrict';

const fs = require('fs');
const path = require('path');
const parse = require('csv-parse');
const lodash = require('lodash');
const yargs = require('yargs');

module.exports = csvSelectedCols2md;


const argv = yargs
  .usage(
    `Select columns from csv file and then convert them to markdown file
(c) 2014-2019 by Rubyzhao, MIT License
Usage: $0 csvFile [options]`,
  )
  .option('columns', {
    alias: 'c',
    description: 'Columns are be selected',
    type: 'string',
  })
  .example(`csv-columns2md data.csv`,
    `Converts data.csv to data.md file`)

  .example(
    `csv-columns2md data.csv -c 1,2,5-7,10
Select columns: 1,2,5,6,7 and 10 from data.csv, then convert them to data.md file`,
  )
  .help('h')
  .alias('h', 'help')
  .argv;

const csvFileName = process.argv[1];
const mdFileName = path.basename(csvFileName, '.csv') + '.md';
//console.log(mdFileName);

const stringColumnsIDs = argv.columns; // '3-5,1,6'
//console.log(stringColumnsIDs);

// There is no issue for sequence in ColumnsIDs. The sequence in CSV will not be changed
// a-b: a should be greater than b
const stringColumnAlign = 'Left';
// 'Left,'Right' or 'Center'
csvSelectedCols2md(
  csvFileName,
  mdFileName,
  stringColumnsIDs,
  stringColumnAlign,
);
/**
 * Convert selected columns from csvFileName based on ColumnsIDs to mdFileName.
 * The column can be aligned based on ColumnAlign: 'Left','Right' or 'Center'
 * The Max width of column is defined by column name at first row
 *
 * @todo: In Readme.md at Github: only Left works correctly currently. 10 Nov 2019
 *
 * @param {string} csvFileName
 * @param {string} mdFileName
 * @param {string} ColumnsIDs, optional, default:'', Select all
 * @param {string} ColumnAlign,optional, default:Left
 */
function csvSelectedCols2md(
  csvFileName,
  mdFileName,
  strColumnsIDs,
  strColumnAlign,
) {
  strColumnsIDs = strColumnsIDs || '';
  strColumnAlign = strColumnAlign || 'Left';
  const csv = fs.readFileSync(csvFileName, 'utf-8');
  parse(csv, {}, function (err, output) {
    // console.log(output);
    let lines = '';
    if (strColumnsIDs.length > 0) {
      // select part of columns
      const ColumnsIDArray = GetColumnsIDs(strColumnsIDs);
      const newOutput = SelectedColumns(output, ColumnsIDArray);
      lines = csvArray2md(newOutput, strColumnAlign);
    } else {
      // select all columns
      lines = csvArray2md(output, strColumnAlign);
    }

    fs.writeFile(mdFileName, lines, err => {
      if (err) throw err; // In case of a error throw err.
    });
  });
}

/**
 * Get ColumnIDs array from stringID
 * @param {string} stringID: 3,4,12,6-9,20
 * @returns {array} Columns
 */
function GetColumnsIDs(stringID) {
  const ColumnsID = [];
  const IDs = stringID.split(',');
  for (let i = 0; i < IDs.length; i++) {
    if (IDs[i].indexOf('-') < 0) {
      ColumnsID.push(Number(IDs[i])); // Single number
    } else {
      // find 5-10
      const startEnd = IDs[i].split('-');
      // console.log(startEnd);
      ColumnsID.push(
        lodash.range(Number(startEnd[0]), Number(startEnd[1]) + 1),
      );
    }
  }
  return ColumnsID.flat();
}
/**
 * Based on ColumnIDs to select the columns from Rows
 * @param {2D Array} Rows
 * @param {array} ColumnIDs
 * @return {2D Array}
 */
function SelectedColumns(Rows, ColumnIDs) {
  const newRows = new Array(Rows.length);
  for (let r = 0; r < Rows.length; r++) {
    newRows[r] = new Array(ColumnIDs.length);
    let col = 0;
    for (let c = 0; c < Rows[r].length; c++) {
      if (ColumnIDs.includes(c)) {
        newRows[r][col] = Rows[r][c];
        col++;
      }
    }
  }
  return newRows;
}
/**
 *
 * @param {array} Rows
 * @param {string} Align: Left, Right, Center
 * @returns {string} Markdown string
 * Markdown format: https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet#tables
 */
function csvArray2md(Rows, Align) {
  let lines = '';
  let widths = [];
  for (let i = 0; i < Rows.length; i++) {
    //console.log(lines);

    if (i == 1) {
      lines += '---|'.repeat(Rows[0].length) + '\n'; // based on the columns first row, add ---|---|
    } else if (i == 0) {
      lines += `${Rows[i].join('|')}\n`; // First row
      widths = GetWidth(Rows[i]); // Get the width of each column
    }
    if (i > 0) {
      lines += `${AlignRow(Rows[i], Align, widths)}\n`; // based on the widths of the column at first row to adjust the current row column
      // console.log(line);
    }
  }
  return lines;
}
/**
 *
 * @param {array} Row0: first row
 * @returns {array} widths of each columns
 */
function GetWidth(Row0) {
  const widths = [];

  for (let i = 0; i < Row0.length; i++) {
    widths.push(Row0[i].length);
  }
  return widths;
}

/**
 *
 * @param {string} Align
 * @param {array} Row: the current row
 * @returns{array} Width for each column
 */
function AlignRow(Row, Align, Width) {
  let line = '';
  for (let i = 0; i < Row.length; i++) {
    let spaces = Width[i] - Row[i].length;
    if (spaces < 0) spaces = 0; // If the width of current row is higher than first row, don't change it
    switch (Align) {
      case 'Left':
        line += `${Row[i]}|`;
        break;
      case 'Right':
        line += ' '.repeat(spaces) + Row[i] + '|';
        break;
      case 'Center':
        const left = spaces / 2;
        const right = spaces - left;
        line += ' '.repeat(left) + Row[i] + ' '.repeat(right) + '|';
        break;
      default:
        console.log('Wrong Alignment');
    }
  }
  // console.log(line);

  return line;
}