"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const connectionString = 'mongodb://localhost:27017/?useUnifiedTopology=true&useNewUrlParser=true/students';
class Course {
    constructor(courseName) {
        this.courseName = courseName;
        this.grades = [];
        this._avgGrade = 0;
    }
    get avgGrade() {
        return this._avgGrade;
    }
    set avgGrade(value) {
        this._avgGrade = value;
    }
    addGrade(grade) {
        if (typeof grade === 'string') {
            switch (grade.toUpperCase()) {
                case 'A+':
                    grade = 100;
                    break;
                case 'A':
                    grade = 90;
                    break;
                case 'B':
                    grade = 80;
                    break;
                // Другие буквенные оценки можно добавить по аналогии
                default:
                    grade = 0;
            }
        }
        this.grades.push(grade);
        this.updateAvgGrade();
    }
    updateAvgGrade() {
        const sum = this.grades.reduce((acc, grade) => acc + grade, 0);
        this.avgGrade = sum / this.grades.length || 0;
    }
}
class Student {
    constructor(name, id) {
        this.name = name;
        this.id = id;
        this.courses = {};
    }
    addCourse(courseName) {
        if (!this.courses[courseName]) {
            this.courses[courseName] = new Course(courseName);
        }
    }
    addGrade(courseName, grade) {
        const course = this.courses[courseName];
        if (course) {
            course.addGrade(grade);
        }
    }
    displayStudentInfo() {
        let info = `Student Information:\nName: ${this.name}\nID: ${this.id}\nCourses:\n`;
        for (const courseName in this.courses) {
            const course = this.courses[courseName];
            info += `- ${course.courseName}: ${course.grades}, avg: ${course.avgGrade}\n`;
        }
        return info;
    }
    //   mongodb+srv://anitvlad288:ySyO53FmQG3z5AA7@cluster0.9fqsjbx.mongodb.net/students
    saveToDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = new mongodb_1.MongoClient(connectionString);
            try {
                yield client.connect();
                const db = client.db('studentsDB');
                const collection = db.collection('students');
                const existingStudent = yield collection.findOne({ id: this.id });
                if (existingStudent) {
                    yield collection.updateOne({ id: this.id }, { $set: this });
                }
                else {
                    yield collection.insertOne(this);
                }
            }
            finally {
                yield client.close();
            }
        });
    }
    static loadFromDatabase(studentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = new mongodb_1.MongoClient(connectionString);
            try {
                yield client.connect();
                const db = client.db('studentsDB');
                const collection = db.collection('students');
                const student = yield collection.findOne({ id: parseInt(studentId) });
                if (student) {
                    const loadedStudent = new Student(student.name, student.id);
                    loadedStudent.courses = student.courses;
                    return loadedStudent;
                }
                else {
                    return null;
                }
            }
            finally {
                yield client.close();
            }
        });
    }
}
class InternationalStudent extends Student {
    constructor(name, id, country) {
        super(name, id);
        this.country = country;
    }
    displayStudentInfo() {
        return `${super.displayStudentInfo()}Country: ${this.country}\n`;
    }
}
// Пример использования
const student1 = new Student('John Doe', 12345);
student1.addCourse('Math');
student1.addCourse('History');
student1.addGrade('Math', 95);
student1.addGrade('Math', 95);
student1.addGrade('History', 80);
console.log(student1.displayStudentInfo());
const internationalStudent1 = new InternationalStudent('Alice Wonderland', 56789, 'USA');
internationalStudent1.addCourse('Physics');
internationalStudent1.addCourse('Literature');
internationalStudent1.addGrade('Physics', 'A+');
internationalStudent1.addGrade('Physics', 'A');
internationalStudent1.addGrade('Literature', 80);
console.log(internationalStudent1.displayStudentInfo());
// Сохранение и загрузка данных из базы данных
student1.saveToDatabase().then(() => __awaiter(void 0, void 0, void 0, function* () {
    const loadedStudent = yield Student.loadFromDatabase('12345');
    if (loadedStudent) {
        console.log(loadedStudent.displayStudentInfo());
    }
    else {
        console.log('Student not found in the database');
    }
}));
