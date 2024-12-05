# TaskFlow: Musical Practice Routine Optimization

TaskFlow is a personalized practice scheduling tool designed for musicians, leveraging evolutionary algorithms to dynamically optimize practice routines. It balances task prioritization, hierarchical dependencies, and time constraints based on user input and historical performance metrics.

## Features
- Dynamic Scheduling: Generates personalized routines tailored to user-defined constraints, such as task difficulty, time limits, and progress metrics (e.g., BPM).
- Interactive Graph Interface: Visualize tasks, dependencies, and hierarchies using an intuitive graph-based UI.
- Evolutionary Algorithm: Employs genetic algorithms to optimize task sequences and schedules for maximum efficiency.
- Real-World Application: Tailored to the needs of musicians, with validated results from a vocal performance student.

## Getting Started

### Prerequisites
- Backend: Java, Spring Boot
- Frontend: Node.js, React, TypeScript
- Database: MySQL
- Dependencies:
  - vis-network for graph rendering.
  - Genetic algorithm utilities (custom or DEAP for testing).
  - API tools for communication between frontend and backend.

## Getting Started

### Prerequisites
- Backend: Java, Spring Boot
- Frontend: Node.js, React, TypeScript
- Database: MySQL
- Dependencies:
  - vis-network for graph rendering.
  - Genetic algorithm utilities (custom or DEAP for testing).
  - API tools for communication between frontend and backend.

### Installation

1. Clone the Repository:
   git clone https://github.com/ehh67855/TaskFlow.git
   cd TaskFlow

2. Backend Setup:
   - Install Java and Spring Boot.
   - Configure MySQL database.
   - Update database connection settings in `application.properties`.
   - Start the backend:
     mvn spring-boot:run

3. Frontend Setup:
   - Install Node.js and npm.
   - Navigate to the frontend directory:
     cd frontend
     npm install
   - Start the frontend development server:
     npm start

## How It Works

1. User Input:
   - Define practice tasks with attributes like difficulty, priority, and estimated time.
   - Set dependencies and hierarchical relationships using the graph interface.

2. Optimization Process:
   - Initialization: Randomly generate practice schedules.
   - Fitness Evaluation: Evaluate schedules based on objectives like BPM improvement and time adherence.
   - Genetic Operators:
     - Selection: Tournament selection ensures diverse solutions.
     - Crossover: Single-point crossover for combining solutions.
     - Mutation: Swap mutation introduces variation.
   - Iteration: Repeat for 25 generations, improving the schedule with each iteration.

3. Output:
   - Visualized routine with optimized task sequences.
   - Detailed metrics such as BPM improvement and task time allocation.

## Tech Stack

### Backend:
- Spring Boot: Handles algorithm execution and API integration.
- MySQL: Stores user data and historical metrics.

### Frontend:
- React & TypeScript: Delivers a responsive, interactive interface.
- VisNetwork.js: Renders dynamic task and dependency graphs.

## Results

### Performance
- Fitness Improvement: Achieved a 93.3% improvement over 10 runs.
- Time Utilization: Efficiently utilized 100% of the available practice time.

### User Feedback
- Practical Usability: Vocal performance students found the optimized routines logical and aligned with their goals.
- Areas for Improvement: Suggestions included adding flexibility, better visualizations, and adaptive scheduling.

## Future Enhancements
- Real-Time Feedback: Adjust schedules dynamically during practice.
- Multi-Objective Optimization: Balance technical improvement with creative exploration.
- Adaptive Techniques: Implement adaptive mutation rates and crossover strategies.
- Collaborative Features: Extend functionality for group practice scenarios.

## Contact
Evan Hammam  
University of Georgia, Computer Science  
Email: eh67855@uga.edu  

TaskFlow – Turning practice into progress. 🎵
