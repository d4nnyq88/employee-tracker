const inquirer = require('inquirer');
const consoleTable = require('console.table');
const db = require('./server');

init = () => {
    inquirer
        .prompt([
            {
                type: "list",
                name: "action",
                message: "What would you like to do?",
                choices: [
                    "View all departments",
                    "View all roles",
                    "View all employees",
                    "Add a department",
                    "Add a role",
                    "Add an employee",
                    "Update an employee role",
                    "Quit",
                ],
            }

        ]).then(userChoice => {
            switch (userChoice.action) {
                case "View all departments":
                    viewAllDepartments();
                    break;
                case "View all roles":
                    viewAllRoles();
                    break;
                case "View all employees":
                    viewAllEmployees();
                    break;
                case "Add a department":
                    addDepartment();
                    break;
                case "Add a role":
                    addRole();
                    break;
                case "Add an employee":
                    addEmployee();
                    break;
                case "Update an employee role":
                    updateEmployeeRole();
                    break;
                case "Quit":
                    console.log("Exiting Employee Tracker.");
                    break;               
            }
        });

};

function viewAllDepartments() {
    db.query('SELECT * FROM departments', (err, rows) => {
        if (err) {
          console.error(err);
          return;
        }
        console.table('\n', rows.slice(0));
        init();
      });
}

function viewAllRoles() {
    db.query('SELECT roles.id, roles.title, roles.salary, departments.department_name AS department FROM roles JOIN departments ON departments.id = roles.department_id', (err, rows) => {
        if (err) {
          console.error(err);
          return;
        }
        console.table('\n', rows.slice(0));
        init();
      });
}

init();