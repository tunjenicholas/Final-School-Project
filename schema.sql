-- Create Users table
-- CREATE TABLE Users (
--     user_id INT PRIMARY KEY AUTO_INCREMENT,
--     username VARCHAR(50) UNIQUE NOT NULL,
--     password_hash VARCHAR(255) NOT NULL,
--     email VARCHAR(100) UNIQUE NOT NULL,
--     full_name VARCHAR(100) NOT NULL,
--     last_login DATETIME,
--     is_active BOOLEAN DEFAULT TRUE
-- );

-- ALTER TABLE Users
-- ADD COLUMN is_verified BOOLEAN DEFAULT FALSE,
-- ADD COLUMN verification_token VARCHAR(255),
-- ADD COLUMN reset_token VARCHAR(255);

-- Create Roles table
-- CREATE TABLE Roles (
--     role_id INT PRIMARY KEY AUTO_INCREMENT,
--     role_name VARCHAR(50) UNIQUE NOT NULL,
--     permissions TEXT
-- );

-- Create UserRoles table (for many-to-many relationship)
-- CREATE TABLE UserRoles (
--     user_id INT,
--     role_id INT,
--     PRIMARY KEY (user_id, role_id),
--     FOREIGN KEY (user_id) REFERENCES Users(user_id),
--     FOREIGN KEY (role_id) REFERENCES Roles(role_id)
-- );

-- Create Students table
-- CREATE TABLE Students (
--     student_id INT PRIMARY KEY AUTO_INCREMENT,
--     user_id INT UNIQUE,
--     student_number VARCHAR(20) UNIQUE NOT NULL,
--     grade_level INT,
--     FOREIGN KEY (user_id) REFERENCES Users(user_id)
-- );

-- Create Teachers table
-- CREATE TABLE Teachers (
--     teacher_id INT PRIMARY KEY AUTO_INCREMENT,
--     user_id INT UNIQUE,
--     employee_number VARCHAR(20) UNIQUE NOT NULL,
--     FOREIGN KEY (user_id) REFERENCES Users(user_id)
-- );

-- Create Parents table
-- CREATE TABLE Parents (
--     parent_id INT PRIMARY KEY AUTO_INCREMENT,
--     user_id INT UNIQUE,
--     FOREIGN KEY (user_id) REFERENCES Users(user_id)
-- );

-- CREATE TABLE IF NOT EXISTS subjects (
--     subject_id SERIAL PRIMARY KEY,
--     subject_name VARCHAR(50) NOT NULL
-- );

-- CREATE TABLE Classes (
--     class_id INT AUTO_INCREMENT PRIMARY KEY,
--     class_name VARCHAR(50) NOT NULL,
--     UNIQUE (class_name)
-- );

-- CREATE TABLE StudentClasses (
--     student_class_id INT AUTO_INCREMENT PRIMARY KEY,
--     user_id INT NOT NULL,
--     class_id INT NOT NULL,
--     academic_year VARCHAR(9) NOT NULL,
--     FOREIGN KEY (user_id) REFERENCES Users(user_id),
--     FOREIGN KEY (class_id) REFERENCES Classes(class_id),
--     UNIQUE (user_id, academic_year)
-- );

-- CREATE TABLE IF NOT EXISTS results (
--     result_id SERIAL PRIMARY KEY,
--     student_id INTEGER REFERENCES users(user_id),
--     class_id INTEGER REFERENCES classes(class_id),
--     subject_id INTEGER REFERENCES subjects(subject_id),
--     score NUMERIC(5,2) NOT NULL,
--     grade VARCHAR(2) NOT NULL,
--     term VARCHAR(10) NOT NULL,
--     academic_year VARCHAR(9) NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
-- Add the teacher_comment column
-- ALTER TABLE results
-- ADD COLUMN teacher_comment TEXT;

-- ALTER TABLE Results ADD COLUMN teacher_comment TEXT;
-- ALTER TABLE results
-- ADD COLUMN grade_points DECIMAL(3,1) NOT NULL DEFAULT 0.0;

-- Create TeacherSubject table (for many-to-many relationship)
-- CREATE TABLE TeacherSubject (
--     teacher_id INT,
--     subject_id INT,
--     PRIMARY KEY (teacher_id, subject_id),
--     FOREIGN KEY (teacher_id) REFERENCES Teachers(teacher_id),
--     FOREIGN KEY (subject_id) REFERENCES Subjects(subject_id)
-- );

-- ALTER TABLE Users ADD COLUMN user_type ENUM('student', 'teacher', 'parent', 'admin') NOT NULL DEFAULT 'student';

-- CREATE TABLE ParentStudent (
--     parent_student_id INT AUTO_INCREMENT PRIMARY KEY,
--     parent_id INT NOT NULL,
--     student_id INT NOT NULL,
--     FOREIGN KEY (parent_id) REFERENCES Users(user_id),
--     FOREIGN KEY (student_id) REFERENCES Users(user_id),
--     UNIQUE (parent_id, student_id)
-- );

-- CREATE TABLE Notifications (
--     notification_id INT AUTO_INCREMENT PRIMARY KEY,
--     user_id INT NOT NULL,
--     message TEXT NOT NULL,
--     is_read BOOLEAN DEFAULT FALSE,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (user_id) REFERENCES Users(user_id)
-- );
-- ALTER TABLE Notifications
-- ADD COLUMN student_id INT,
-- ADD FOREIGN KEY (student_id) REFERENCES Students(student_id);

-- CREATE TABLE IF NOT EXISTS StudentPerformance (
--     performance_id INT AUTO_INCREMENT PRIMARY KEY,
--     user_id INT NOT NULL,
--     term VARCHAR(20) NOT NULL,
--     academic_year VARCHAR(10) NOT NULL,
--     average_score DECIMAL(5,2) NOT NULL,
--     overall_grade VARCHAR(2) NOT NULL,
--     FOREIGN KEY (user_id) REFERENCES Users(user_id),
--     UNIQUE KEY unique_performance (user_id, term, academic_year)
-- );

-- CREATE TABLE IF NOT EXISTS ActivityLog (
--     log_id INT AUTO_INCREMENT PRIMARY KEY,
--     user_id INT,
--     action VARCHAR(255) NOT NULL,
--     timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (user_id) REFERENCES Users(user_id)
-- );

-- CREATE TABLE IF NOT EXISTS student_stats (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   student_id INT,
--   class_id INT,
--   term VARCHAR(20),
--   academic_year VARCHAR(9),
--   total_marks FLOAT,
--   position_in_class INT,
--   position_in_stream INT,
--   FOREIGN KEY (student_id) REFERENCES users(user_id),
--   FOREIGN KEY (class_id) REFERENCES classes(class_id)
-- );

-- ALTER TABLE classes ADD COLUMN stream_id INT;-- 

-- Add streams table
-- CREATE TABLE IF NOT EXISTS streams (
--   stream_id INT AUTO_INCREMENT PRIMARY KEY,
--   stream_name VARCHAR(50) NOT NULL,
--   form_name VARCHAR(50) NOT NULL
-- );

-- Update classes table to include stream_id
-- ALTER TABLE classes ADD COLUMN stream_id INT;
-- ALTER TABLE classes ADD FOREIGN KEY (stream_id) REFERENCES streams(stream_id);

-- ALTER TABLE subjects ADD COLUMN subject_type INT;

-- Insert streams data
-- INSERT INTO streams (stream_name, form_name) VALUES
-- ('RED', 'FORM 1'), ('BLUE', 'FORM 1'), ('GREEN', 'FORM 1'), ('YELLOW', 'FORM 1'), ('WHITE', 'FORM 1'),
-- ('RED', 'FORM 2'), ('BLUE', 'FORM 2'), ('GREEN', 'FORM 2'), ('YELLOW', 'FORM 2'), ('WHITE', 'FORM 2'),
-- ('RED', 'FORM 3'), ('BLUE', 'FORM 3'), ('GREEN', 'FORM 3'), ('YELLOW', 'FORM 3'), ('WHITE', 'FORM 3'),
-- ('RED', 'FORM 4'), ('BLUE', 'FORM 4'), ('GREEN', 'FORM 4'), ('YELLOW', 'FORM 4'), ('WHITE', 'FORM 4');

-- Update classes data
-- UPDATE classes SET stream_id = (SELECT stream_id FROM streams WHERE streams.stream_name = SUBSTRING_INDEX(classes.class_name, ' ', -1) AND streams.form_name = SUBSTRING_INDEX(classes.class_name, ' ', 2));

-- Insert subjects
-- INSERT INTO subjects (subject_name, subject_type) VALUES
-- ('English', 'Core'),
-- ('Kiswahili', 'Core'),
-- ('Mathematics', 'Core'),
-- ('Biology', 'Science'),
-- ('Chemistry', 'Science'),
-- ('Physics', 'Science'),
-- ('Geography', 'Humanities'),
-- ('History and Government', 'Humanities'),
-- ('Christian Religious Education', 'Humanities'),
-- ('Islamic Religious Education', 'Humanities'),
-- ('Hindu Religious Education', 'Humanities'),
-- ('Agriculture', 'Optional'),
-- ('Business Studies', 'Optional'),
-- ('Computer Studies', 'Optional'),
-- ('Home Science', 'Optional'),
-- ('Art and Design', 'Optional'),
-- ('Music', 'Optional'),
-- ('French', 'Optional'),
-- ('German', 'Optional'),
-- ('Arabic', 'Optional');


-- Add current_class_id to Students table
-- ALTER TABLE Students ADD COLUMN current_class_id INT;
-- ALTER TABLE Students ADD FOREIGN KEY (current_class_id) REFERENCES Classes(class_id);

-- -- Add current_academic_year to Users table
-- ALTER TABLE Users ADD COLUMN current_academic_year VARCHAR(9);

-- -- Create ClassSubjects table
-- CREATE TABLE ClassSubjects (
--     class_subject_id INT AUTO_INCREMENT PRIMARY KEY,
--     class_id INT,
--     subject_id BIGINT UNSIGNED,
--     FOREIGN KEY (class_id) REFERENCES Classes(class_id),
--     FOREIGN KEY (subject_id) REFERENCES Subjects(subject_id),
--     UNIQUE KEY (class_id, subject_id)
-- );

-- CREATE TABLE IF NOT EXISTS UserSessions (
--     session_id VARCHAR(255) PRIMARY KEY,
--     user_id INT NOT NULL,
--     expires_at TIMESTAMP NOT NULL,
--     FOREIGN KEY (user_id) REFERENCES Users(user_id)
-- );

-- CREATE TABLE Attendance (
--     attendance_id INT PRIMARY KEY AUTO_INCREMENT,
--     student_id INT,
--     date DATE,
--     is_present BOOLEAN,
--     FOREIGN KEY (student_id) REFERENCES Students(student_id)
-- );