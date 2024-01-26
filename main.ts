import { MongoClient } from 'mongodb';

const connectionString =
	'mongodb://localhost:27017/?useUnifiedTopology=true&useNewUrlParser=true/students';

class Course {
	public grades: number[] = [];
	private _avgGrade: number = 0;

	constructor(public courseName: string) {}

	get avgGrade(): number {
		return this._avgGrade;
	}

	set avgGrade(value: number) {
		this._avgGrade = value;
	}

	addGrade(grade: number | string): void {
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
		this.grades.push(grade as number);
		this.updateAvgGrade();
	}

	private updateAvgGrade(): void {
		const sum = this.grades.reduce((acc, grade) => acc + grade, 0);
		this.avgGrade = sum / this.grades.length || 0;
	}
}

class Student {
	public courses: { [key: string]: Course } = {};

	constructor(public name: string, public id: number) {}

	addCourse(courseName: string): void {
		if (!this.courses[courseName]) {
			this.courses[courseName] = new Course(courseName);
		}
	}

	addGrade(courseName: string, grade: number | string): void {
		const course = this.courses[courseName];
		if (course) {
			course.addGrade(grade);
		}
	}

	displayStudentInfo(): string {
		let info = `Student Information:\nName: ${this.name}\nID: ${this.id}\nCourses:\n`;
		for (const courseName in this.courses) {
			const course = this.courses[courseName];
			info += `- ${course.courseName}: ${course.grades}, avg: ${course.avgGrade}\n`;
		}
		return info;
	}
	//   mongodb+srv://anitvlad288:ySyO53FmQG3z5AA7@cluster0.9fqsjbx.mongodb.net/students
	async saveToDatabase(): Promise<void> {
		const client = new MongoClient(connectionString);
		try {
			await client.connect();
			const db = client.db('studentsDB');
			const collection = db.collection('students');

			const existingStudent = await collection.findOne({ id: this.id });
			if (existingStudent) {
				await collection.updateOne({ id: this.id }, { $set: this });
			} else {
				await collection.insertOne(this);
			}
		} finally {
			await client.close();
		}
	}

	static async loadFromDatabase(studentId: string): Promise<Student | null> {
		const client = new MongoClient(connectionString);
		try {
			await client.connect();
			const db = client.db('studentsDB');
			const collection = db.collection('students');

			const student = await collection.findOne({ id: parseInt(studentId) });
			if (student) {
				const loadedStudent = new Student(student.name, student.id);
				loadedStudent.courses = student.courses;
				return loadedStudent;
			} else {
				return null;
			}
		} finally {
			await client.close();
		}
	}
}

class InternationalStudent extends Student {
	constructor(name: string, id: number, public country: string) {
		super(name, id);
	}

	displayStudentInfo(): string {
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

const internationalStudent1 = new InternationalStudent(
	'Alice Wonderland',
	56789,
	'USA'
);
internationalStudent1.addCourse('Physics');
internationalStudent1.addCourse('Literature');
internationalStudent1.addGrade('Physics', 'A+');
internationalStudent1.addGrade('Physics', 'A');
internationalStudent1.addGrade('Literature', 80);
console.log(internationalStudent1.displayStudentInfo());

// Сохранение и загрузка данных из базы данных
student1.saveToDatabase().then(async () => {
	const loadedStudent = await Student.loadFromDatabase('12345');
	if (loadedStudent) {
		console.log(loadedStudent.displayStudentInfo());
	} else {
		console.log('Student not found in the database');
	}
});
