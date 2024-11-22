exports.calculateGrade = (score) => {
    if (score > 100) return 'F';
    if (score >= 80) return 'A';
    if (score >= 75) return 'A-';
    if (score >= 70) return 'B+';
    if (score >= 65) return 'B';
    if (score >= 60) return 'B-';
    if (score >= 55) return 'C+';
    if (score >= 50) return 'C';
    if (score >= 45) return 'C-';
    if (score >= 40) return 'D+';
    if (score >= 35) return 'D';
    if (score >= 30) return 'D-';
    if (score > 0) return 'E';
    return 'F';
}

exports.calculateGradePoints = (grade) => {
    switch (grade) {
        case 'A': return 12.0;
        case 'A-': return 11.0;
        case 'B+': return 10.0;
        case 'B': return 9.0;
        case 'B-': return 8.0;
        case 'C+': return 7.0;
        case 'C': return 6.0;
        case 'C-': return 5.0;
        case 'D+': return 4.0;
        case 'D': return 3.0;
        case 'D-': return 2.0;
        case 'E': return 1.0;
        default: return 0.0;
    }
}