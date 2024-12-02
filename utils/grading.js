const gradeRanges = [
    { min: 80, max: 100, grade: 'A', points: 12 },
    { min: 75, max: 79, grade: 'A-', points: 11 },
    { min: 70, max: 74, grade: 'B+', points: 10 },
    { min: 65, max: 69, grade: 'B', points: 9 },
    { min: 60, max: 64, grade: 'B-', points: 8 },
    { min: 55, max: 59, grade: 'C+', points: 7 },
    { min: 50, max: 54, grade: 'C', points: 6 },
    { min: 45, max: 49, grade: 'C-', points: 5 },
    { min: 40, max: 44, grade: 'D+', points: 4 },
    { min: 35, max: 39, grade: 'D', points: 3 },
    { min: 30, max: 34, grade: 'D-', points: 2 },
    { min: 0, max: 29, grade: 'E', points: 1 }
];

exports.calculateGrade = (score) => {
    for (const range of gradeRanges) {
        if (score >= range.min && score <= range.max) {
            return range.grade;
        }
    }
    return 'N/A';
};

exports.calculateGradePoints = (grade) => {
    const gradeInfo = gradeRanges.find(range => range.grade === grade);
    return gradeInfo ? gradeInfo.points : 0;
};