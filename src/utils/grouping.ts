import { Student, Player } from '../types';
import { PLAYER_COLORS } from '../constants';

// Fisher-Yates Shuffle
const shuffleArray = <T>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export const generateSmartGroups = (students: Student[], groupCount: number): Player[] => {
  const males = shuffleArray(students.filter(s => s.gender === 'L'));
  const females = shuffleArray(students.filter(s => s.gender === 'P'));

  const groups: Student[][] = Array.from({ length: groupCount }, () => []);

  // Distribute Males
  males.forEach((student, index) => {
    const groupIndex = index % groupCount;
    groups[groupIndex].push(student);
  });

  // Distribute Females
  females.forEach((student, index) => {
    const groupIndex = index % groupCount;
    groups[groupIndex].push(student);
  });

  // Convert to Player objects
  return groups.map((groupStudents, index) => ({
    id: index,
    name: `Kelompok ${index + 1}`,
    position: 1,
    color: PLAYER_COLORS[index % PLAYER_COLORS.length],
    members: groupStudents.map(s => s.name)
  }));
};