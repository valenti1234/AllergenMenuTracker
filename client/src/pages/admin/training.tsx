import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useTranslation } from "react-i18next";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Play,
  Award,
  BookOpen,
  Users,
  User,
  BarChart,
} from "lucide-react";

// Types for training data
interface TrainingModule {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  topics: string[];
  quizId: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  passingScore: number;
}

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

interface StaffTraining {
  userId: string;
  userName: string;
  moduleId: string;
  moduleName: string;
  completed: boolean;
  score: number | null;
  passed: boolean;
  completedAt: string | null;
}

// Mock data for training modules
const mockTrainingModules: TrainingModule[] = [
  {
    id: "allergen-basics",
    title: "Allergen Basics",
    description: "Learn the fundamentals of food allergens and their impact on customers",
    duration: 30,
    topics: ["Common allergens", "Symptoms of allergic reactions", "Legal requirements"],
    quizId: "quiz-allergen-basics",
  },
  {
    id: "cross-contamination",
    title: "Preventing Cross-Contamination",
    description: "Techniques to prevent allergen cross-contamination in the kitchen",
    duration: 45,
    topics: ["Kitchen organization", "Cleaning procedures", "Food preparation protocols"],
    quizId: "quiz-cross-contamination",
  },
  {
    id: "customer-communication",
    title: "Customer Communication",
    description: "How to effectively communicate allergen information to customers",
    duration: 25,
    topics: ["Taking orders", "Answering questions", "Menu explanations"],
    quizId: "quiz-customer-communication",
  },
  {
    id: "emergency-response",
    title: "Emergency Response",
    description: "How to respond to allergic reactions in the restaurant",
    duration: 35,
    topics: ["Recognizing symptoms", "First aid procedures", "Emergency contacts"],
    quizId: "quiz-emergency-response",
  },
];

// Mock data for quizzes
const mockQuizzes: Quiz[] = [
  {
    id: "quiz-allergen-basics",
    title: "Allergen Basics Quiz",
    description: "Test your knowledge of food allergens",
    questions: [
      {
        id: "q1",
        text: "Which of the following is NOT one of the 14 major allergens?",
        options: ["Milk", "Eggs", "Tomatoes", "Peanuts"],
        correctAnswer: 2,
      },
      {
        id: "q2",
        text: "What percentage of the population has food allergies?",
        options: ["About 1-2%", "About 5-10%", "About 20-25%", "About 30-35%"],
        correctAnswer: 1,
      },
      {
        id: "q3",
        text: "Which symptom is NOT typically associated with food allergies?",
        options: ["Hives", "Swelling", "Fever", "Difficulty breathing"],
        correctAnswer: 2,
      },
    ],
    passingScore: 70,
  },
  {
    id: "quiz-cross-contamination",
    title: "Cross-Contamination Quiz",
    description: "Test your knowledge of preventing allergen cross-contamination",
    questions: [
      {
        id: "q1",
        text: "What is the best way to prevent cross-contamination?",
        options: [
          "Use the same utensils for all foods",
          "Use separate utensils for allergen-free foods",
          "Rinse utensils between uses",
          "Cook all foods together",
        ],
        correctAnswer: 1,
      },
      {
        id: "q2",
        text: "How should you clean surfaces to prevent allergen cross-contamination?",
        options: [
          "Wipe with a dry cloth",
          "Rinse with water",
          "Clean with soap and water, then sanitize",
          "Use the same cloth for all surfaces",
        ],
        correctAnswer: 2,
      },
    ],
    passingScore: 80,
  },
];

// Mock data for staff training records
const mockStaffTraining: StaffTraining[] = [
  {
    userId: "user1",
    userName: "John Smith",
    moduleId: "allergen-basics",
    moduleName: "Allergen Basics",
    completed: true,
    score: 85,
    passed: true,
    completedAt: "2023-03-15T14:30:00Z",
  },
  {
    userId: "user1",
    userName: "John Smith",
    moduleId: "cross-contamination",
    moduleName: "Preventing Cross-Contamination",
    completed: true,
    score: 90,
    passed: true,
    completedAt: "2023-03-16T10:15:00Z",
  },
  {
    userId: "user2",
    userName: "Jane Doe",
    moduleId: "allergen-basics",
    moduleName: "Allergen Basics",
    completed: true,
    score: 75,
    passed: true,
    completedAt: "2023-03-14T09:45:00Z",
  },
  {
    userId: "user2",
    userName: "Jane Doe",
    moduleId: "cross-contamination",
    moduleName: "Preventing Cross-Contamination",
    completed: false,
    score: null,
    passed: false,
    completedAt: null,
  },
];

export default function TrainingPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizResults, setQuizResults] = useState<{
    score: number;
    passed: boolean;
    incorrectQuestions: number[];
  } | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  // Fetch training modules
  const { data: trainingModules = mockTrainingModules } = useQuery({
    queryKey: ["trainingModules"],
    queryFn: async () => {
      // In a real implementation, this would fetch from the API
      // const response = await apiRequest("/api/training/modules");
      // return response;
      return mockTrainingModules;
    },
  });

  // Fetch staff training records
  const { data: staffTraining = mockStaffTraining } = useQuery({
    queryKey: ["staffTraining"],
    queryFn: async () => {
      // In a real implementation, this would fetch from the API
      // const response = await apiRequest("/api/training/staff");
      // return response;
      return mockStaffTraining;
    },
  });

  // Calculate training statistics
  const trainingStats = {
    totalStaff: [...new Set(staffTraining.map((record) => record.userId))].length,
    completedTrainings: staffTraining.filter((record) => record.completed).length,
    certifiedStaff: [...new Set(staffTraining.filter((record) => record.passed).map((record) => record.userId))].length,
    averageScore: staffTraining.filter((record) => record.score !== null).reduce((sum, record) => sum + (record.score || 0), 0) / 
                  staffTraining.filter((record) => record.score !== null).length || 0,
  };

  // Start a training module
  const handleStartModule = (module: TrainingModule) => {
    setSelectedModule(module);
    // In a real implementation, you would fetch the module content
    const quiz = mockQuizzes.find((q) => q.id === module.quizId);
    if (quiz) {
      setSelectedQuiz(quiz);
      setQuizAnswers(new Array(quiz.questions.length).fill(-1));
    }
  };

  // Start the quiz for a module
  const handleStartQuiz = () => {
    setShowQuiz(true);
    setQuizResults(null);
  };

  // Handle quiz answer selection
  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...quizAnswers];
    newAnswers[questionIndex] = answerIndex;
    setQuizAnswers(newAnswers);
  };

  // Submit quiz answers
  const handleSubmitQuiz = () => {
    if (!selectedQuiz) return;

    // Calculate score
    let correctAnswers = 0;
    const incorrectQuestions: number[] = [];

    selectedQuiz.questions.forEach((question, index) => {
      if (quizAnswers[index] === question.correctAnswer) {
        correctAnswers++;
      } else {
        incorrectQuestions.push(index);
      }
    });

    const score = Math.round((correctAnswers / selectedQuiz.questions.length) * 100);
    const passed = score >= selectedQuiz.passingScore;

    setQuizResults({
      score,
      passed,
      incorrectQuestions,
    });

    // In a real implementation, you would save the results to the API
    toast({
      title: passed ? "Quiz Passed!" : "Quiz Failed",
      description: `You scored ${score}%. ${passed ? "Congratulations!" : "Please try again."}`,
      variant: passed ? "default" : "destructive",
    });
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Staff Training Module</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-muted-foreground" />
                <span className="text-3xl font-bold">{trainingStats.totalStaff}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Certified Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Award className="h-5 w-5 mr-2 text-muted-foreground" />
                <span className="text-3xl font-bold">{trainingStats.certifiedStaff}</span>
              </div>
              <Progress 
                value={(trainingStats.certifiedStaff / trainingStats.totalStaff) * 100} 
                className="h-2 mt-2" 
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <BarChart className="h-5 w-5 mr-2 text-muted-foreground" />
                <span className="text-3xl font-bold">{trainingStats.averageScore.toFixed(1)}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="modules">
          <TabsList className="mb-4">
            <TabsTrigger value="modules">Training Modules</TabsTrigger>
            <TabsTrigger value="staff">Staff Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="modules">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {trainingModules.map((module) => (
                <Card key={module.id}>
                  <CardHeader>
                    <CardTitle>{module.title}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center mb-2">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{module.duration} minutes</span>
                    </div>
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Topics covered:</h4>
                      <ul className="list-disc pl-5 text-sm">
                        {module.topics.map((topic, index) => (
                          <li key={index}>{topic}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={() => handleStartModule(module)}>
                      <Play className="h-4 w-4 mr-2" />
                      Start Training
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="staff">
            <Card>
              <CardHeader>
                <CardTitle>Staff Training Progress</CardTitle>
                <CardDescription>
                  Track the training progress of all staff members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff Member</TableHead>
                        <TableHead>Training Module</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Completed Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staffTraining.map((record, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{record.userName}</TableCell>
                          <TableCell>{record.moduleName}</TableCell>
                          <TableCell>
                            {record.completed ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {record.score !== null ? `${record.score}%` : "-"}
                          </TableCell>
                          <TableCell>
                            {record.completedAt
                              ? format(new Date(record.completedAt), "MMM d, yyyy")
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Training Module Dialog */}
        {selectedModule && (
          <Dialog open={!!selectedModule} onOpenChange={() => setSelectedModule(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedModule.title}</DialogTitle>
                <DialogDescription>{selectedModule.description}</DialogDescription>
              </DialogHeader>

              {!showQuiz ? (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{selectedModule.duration} minutes</span>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Module Content</h3>
                    
                    {/* This would be replaced with actual content in a real implementation */}
                    <div className="space-y-4">
                      <section>
                        <h4 className="text-md font-medium">Introduction</h4>
                        <p className="text-muted-foreground">
                          This training module covers important information about food allergens
                          and how to handle them safely in a restaurant environment.
                        </p>
                      </section>

                      {selectedModule.topics.map((topic, index) => (
                        <section key={index}>
                          <h4 className="text-md font-medium">Topic: {topic}</h4>
                          <p className="text-muted-foreground">
                            Detailed information about {topic.toLowerCase()} would be displayed here.
                            This would include text, images, and possibly videos explaining the concepts.
                          </p>
                        </section>
                      ))}

                      <section>
                        <h4 className="text-md font-medium">Summary</h4>
                        <p className="text-muted-foreground">
                          In this module, you've learned about {selectedModule.topics.join(", ")}.
                          These skills are essential for ensuring food safety and customer satisfaction.
                        </p>
                      </section>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-end">
                    <Button onClick={handleStartQuiz}>
                      Take Quiz
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {!quizResults ? (
                    <>
                      <h3 className="text-lg font-medium">{selectedQuiz?.title}</h3>
                      <p className="text-muted-foreground">{selectedQuiz?.description}</p>
                      
                      <div className="space-y-8">
                        {selectedQuiz?.questions.map((question, qIndex) => (
                          <div key={question.id} className="space-y-4">
                            <h4 className="font-medium">
                              Question {qIndex + 1}: {question.text}
                            </h4>
                            <div className="space-y-2">
                              {question.options.map((option, oIndex) => (
                                <div
                                  key={oIndex}
                                  className={`p-3 rounded-md border cursor-pointer ${
                                    quizAnswers[qIndex] === oIndex
                                      ? "bg-primary/10 border-primary"
                                      : "hover:bg-muted"
                                  }`}
                                  onClick={() => handleAnswerSelect(qIndex, oIndex)}
                                >
                                  {option}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end">
                        <Button 
                          onClick={handleSubmitQuiz}
                          disabled={quizAnswers.some((answer) => answer === -1)}
                        >
                          Submit Quiz
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-6">
                      <div className="text-center p-6">
                        {quizResults.passed ? (
                          <div className="space-y-2">
                            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                            <h3 className="text-xl font-bold text-green-500">Quiz Passed!</h3>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
                            <h3 className="text-xl font-bold text-red-500">Quiz Failed</h3>
                          </div>
                        )}
                        <p className="text-lg mt-2">
                          Your score: <span className="font-bold">{quizResults.score}%</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Passing score: {selectedQuiz?.passingScore}%
                        </p>
                      </div>

                      {!quizResults.passed && (
                        <div className="space-y-4">
                          <h4 className="font-medium">Questions to review:</h4>
                          <ul className="list-disc pl-5 space-y-2">
                            {quizResults.incorrectQuestions.map((qIndex) => (
                              <li key={qIndex}>
                                {selectedQuiz?.questions[qIndex].text}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex justify-end space-x-2">
                        {!quizResults.passed && (
                          <Button variant="outline" onClick={handleStartQuiz}>
                            Try Again
                          </Button>
                        )}
                        <Button onClick={() => {
                          setSelectedModule(null);
                          setShowQuiz(false);
                          setQuizResults(null);
                        }}>
                          {quizResults.passed ? "Complete Training" : "Close"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  );
} 