import PlacementClient from './PlacementClient';

const RECRUITERS = [
  'TCS', 'Infosys', 'Wipro', 'HDFC Bank', 'Tech Mahindra', 'Cognizant',
  'Capgemini', 'Accenture', 'IBM', 'Genpact', 'Deloitte', 'Amazon',
];

const STUDENTS = [
  { name: 'Shipra Kumari', company: 'Genpact', designation: 'Management Trainee' },
  { name: 'Ankita Shrivastav', company: 'Wipro', designation: 'Business Analyst' },
  { name: 'Divya', company: 'NIIT Technologies', designation: 'Senior Associate' },
  { name: 'Himanshu Khurana', company: 'BT', designation: 'Senior Analyst' },
  { name: 'Sandeep Roy', company: 'Tech Mahindra', designation: 'Software Engineer' },
  { name: 'Renu Tiwari', company: 'HDFC Bank', designation: 'Analyst' },
  { name: 'Amit Ranjan', company: 'TCS', designation: 'Associate' },
  { name: 'Priyanka Kumari', company: 'Infosys', designation: 'System Engineer' },
  { name: 'Rahul Sharma', company: 'Cognizant', designation: 'Programmer Analyst' },
  { name: 'Neha Gupta', company: 'Capgemini', designation: 'Consultant' },
  { name: 'Vikram Singh', company: 'Accenture', designation: 'Associate Software Engineer' },
  { name: 'Pooja Verma', company: 'IBM', designation: 'Application Developer' },
];

export function generateMetadata() {
  return {
    title: 'Top Placements with Leading Recruiters | Career Success',
    description: 'See how we\'ve helped students land roles at TCS, Infosys, Wipro, HDFC Bank, Accenture, and more. Join thousands with lucrative placements and expert career support.',
    openGraph: {
      title: 'Top Placements with Leading Recruiters',
      description: 'Students placed at TCS, Infosys, Wipro, Accenture, and more. Join thousands who built their careers with us.',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Top Placements with Leading Recruiters',
      description: 'Students placed at top companies. Join thousands who built their careers with us.',
    },
  };
}

export default function PlacementPage() {
  return (
    <PlacementClient
      recruiters={RECRUITERS}
      students={STUDENTS}
    />
  );
}
