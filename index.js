const inquirer = require('inquirer');
const consoleTable = require('console.table');
const db = require('./server');
//function that runs when the app is initialized and lists out actions for the user to select
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
                default:
                    console.log("Something went wrong.");
                    break;
            }
        });
};
//function to view all departments in the database
function viewAllDepartments() {
    db.query(`SELECT * FROM departments`, (err, rows) => {
        if (err) {
          console.error(err);
          return;
        }
        console.table('\n', rows.slice(0));
        init();
      });
}
//function to view all roles in the database
function viewAllRoles() {
    db.query(`SELECT roles.id, roles.title, roles.salary, departments.department_name AS department FROM roles JOIN departments ON departments.id = roles.department_id`, (err, rows) => {
        if (err) {
          console.error(err);
          return;
        }
        console.table('\n', rows.slice(0));
        init();
      });
}
//function to view all employees in the database
function viewAllEmployees() {
    db.query(`SELECT employees.id, employees.first_name, employees.last_name, roles.title, departments.department_name AS department, roles.salary, CONCAT(e.first_name, ' ', e.last_name) AS manager FROM employees LEFT JOIN roles ON roles.id = employees.role_id LEFT JOIN departments ON departments.id = roles.department_id LEFT JOIN employees e ON e.id = employees.manager_id`, (err, rows) => {
        if (err) {
          console.error(err);
          return;
        }
        console.table('\n', rows.slice(0));
        init();
    });
}
//function to add a new department to the departments table in the database
function addDepartment() {
    inquirer
        .prompt([
            {
                type: "input",
                name: "departmentName",
                message: "What is the name of the department?",
                validate: answer => {
                    if (answer !== "") {
                        return true;
                    }
                    return "Please enter at least one character.";
                }
            }
        ]).then(userInput => {
            db.query(`INSERT INTO departments(department_name) VALUES('${userInput.departmentName}')`, (err, result) => {
                if (err) {
                  console.error(err);
                  return;
                }
                console.log(`Added '${userInput.departmentName}' to the database`);
                init();
            });
        });
}
//function to add a new role to the roles table in the database
function addRole() {
    getDepartments().then( ([rows, fields]) => {
        
        const departmentList = rows.map(({ id, department_name }) => ({ name: department_name}));
        //will get an array of rows back

        inquirer
        .prompt([
            {
                type: "input",
                name: "roleName",
                message: "What is the name of the role?",
                validate: answer => {
                    if (answer !== "") {
                        return true;
                    }
                    return "Please enter at least one character.";
                }
            },
            {
                type: "input",
                name: "salary",
                message: "What is the salary of the role?",
                validate: answer => {
                    if (answer !== "") {
                        return true;
                    }
                    return "Please enter at least one character.";
                }
            },
            {
                type: "list",
                name: "departmentName",
                message: "Which department should the role belong to?",
                choices: departmentList,
            },
        ]).then(userInput => {
            
            db.query(`SELECT id FROM departments WHERE department_name = ('${userInput.departmentName}')`, (err, result) => {
                if (err) {
                    console.error(err);
                    return;
                }
                const deptId = result[0].id;
                db.query(`INSERT INTO roles(title, salary, department_id) VALUES('${userInput.roleName}','${userInput.salary}', '${deptId}')`, (err, result) => {
                
                    if (err) {
                      console.error(err);
                      return;
                    }
                    console.log(`Added '${userInput.roleName}' to the database`);
                    init();
                });
            })            
        });        
    })    
}
//function to add a new employee to the employees table in the database
async function addEmployee() {
    
    const managerList = await getManagers();
    const formattedManagerList = managerList[0].map(({ manager_name }) => ({ name: manager_name}));
    const departmentList = await getDepartments();
    const formattedDepartmentList = departmentList[0].map(({ department_name }) => ({ name: department_name}));
    const roleList = await getRoles();    
    const formattedRoleList = roleList[0].map(({ title }) => ({ name: title}));
        
    const userInput = await inquirer
    .prompt([
        {
            type: "input",
            name: "firstName",
            message: "What is the first name of the employee?",
            validate: answer => {
                if (answer !== "") {
                    return true;
                }
                return "Please enter at least one character.";
            }
        },
        {
            type: "input",
            name: "lastName",
            message: "What is the last name of the employee?",
            validate: answer => {
                if (answer !== "") {
                    return true;
                }
                return "Please enter at least one character.";
            }
        },
        {
            type: "list",
            name: "title",
            message: "What is the title of the employee?",
            choices: formattedRoleList,
        },
        {
            type: "list",
            name: "departmentName",
            message: "Which department should the employee belong to?",
            choices: formattedDepartmentList,
        },        
        {
            type: "list",
            name: "managerName",
            message: "Which manager should the employee be assigned?",
            choices: formattedManagerList,
        },
    ]);

    db.query(`SELECT id FROM roles WHERE title = ('${userInput.title}')`, (err, result) => {
        if (err) {
            console.error(err);
            return;
        }
        const roleId = result[0].id;
        
        db.query(`SELECT id FROM employees WHERE first_name = ('${userInput.managerName.split(' ')[0]}') AND last_name = ('${userInput.managerName.split(' ')[1]}')`, (err, result) => {
            if (err) {
                console.error(err);
                return;
            }
            const managerId = result[0].id;  

            db.query(`INSERT INTO employees(first_name, last_name, role_id, manager_id) VALUES('${userInput.firstName}','${userInput.lastName}', '${roleId}', '${managerId}')`, (err, result) => {
        
                if (err) {
                    console.error(err);
                    return;
                }
                console.log(`Added '${userInput.firstName}' '${userInput.lastName}' to the database`);
                init();
            });
        });        
    });
}
//function to update an employees role in the employees table in the database
async function updateEmployeeRole() {
    const employeeList = await getEmployees();
    const formattedEmployeeList = employeeList[0].map(({ employee_name }) => ({ name: employee_name}));
    const roleList = await getRoles();    
    const formattedRoleList = roleList[0].map(({ title }) => ({ name: title}));

    const userInput = await inquirer
    .prompt([
        {
            type: "list",
            name: "employeeName",
            message: "Which employee's role do you want to update?",
            choices: formattedEmployeeList,
        },
        {
            type: "list",
            name: "roleName",
            message: "Which role do you want to assign the selected employee?",
            choices: formattedRoleList,
        },        
    ]);

    db.query(`SELECT id FROM roles WHERE title = ('${userInput.roleName}')`, (err, result) => {
        if (err) {
            console.error(err);
            return;
        }
        const roleId = result[0].id;
        
        db.query(`SELECT id FROM employees WHERE CONCAT(first_name, ' ', last_name) = ('${userInput.employeeName}')`, (err, result) => {
            if (err) {
                console.error(err);
                return;
            }
            const employeeId = result[0].id;  

            db.query(`UPDATE employees SET role_id = ? WHERE id =?`, [roleId, employeeId], (err, result) => {
        
                if (err) {
                    console.error(err);
                    return;
                }
                console.log(`Updated the role of '${userInput.employeeName}' to '${userInput.roleName}' in the database`);
                init();
            });
        });        
    });
}
//function to get a list of all existing departments in the database
function getDepartments() {
    return db.promise().query(`SELECT department_name FROM departments`);
}
//function to get a list of all existing managers in the database
function getManagers() {
    return db.promise().query(`SELECT CONCAT(first_name,' ', last_name) AS manager_name FROM employees WHERE manager_id IS NULL`);
}
//function to get a list of all existing roles in the database
function getRoles() {
    return db.promise().query(`SELECT title FROM roles`);
}
//function to get a list of all existing employees in the database
function getEmployees() {
    return db.promise().query(`SELECT CONCAT(first_name,' ',last_name) AS employee_name FROM employees`);
}
//initializes the app
init();