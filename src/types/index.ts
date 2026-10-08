export type Priority = 'P0' | 'P1' | 'P2' | 'P3' | 'High' | 'Medium' | 'Low';
export type TestStatus = 'PENDING' | 'RUNNING' | 'PASS' | 'FAIL' | 'WARNING' | 'NOT_APPLICABLE' | 'BLOCKED' | 'SKIPPED' | 'STOPPED' | 'NOT_TESTED';
export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';
export type TestCategory = string;
export type OverallStatus = 'PASS' | 'PASS WITH WARNINGS' | 'FAIL';

export type RunnerState = 
  | 'idle' 
  | 'researching' 
  | 'discovering' 
  | 'generating' 
  | 'running' 
  | 'analyzing' 
  | 'crawling' 
  | 'analyzing_bugs' 
  | 'stopped' 
  | 'completed' 
  | 'failed' 
  | 'error';

export interface SystemSettings {
  geminiConfigured: boolean;
  geminiModel: string;
  playwrightReady: boolean;
  defaultTimeoutMs: number;
  maxConcurrentTests: number;
  environment: string;
}

export interface ExecutionLogEvent {
  timestamp: string;
  testId?: string;
  message: string;
  status?: 'PASS' | 'FAIL' | 'WARNING' | 'NOT_APPLICABLE' | 'BLOCKED' | 'RUNNING' | 'PENDING' | 'STOPPED' | 'INFO';
}

export interface WarningReport {
  id: string;
  testId: string;
  testName?: string;
  title: string;
  message: string;
  severity: 'Medium' | 'Low';
  affected_url?: string;
  evidence?: string;
  flaky?: boolean;
}

export interface TestCase {
  id: string;
  title: string;
  name?: string;
  category: string;
  priority: Priority;
  steps: string[];
  description?: string;
  requiredAction?: string;
  targetUrl?: string;
  expected_result: string;
  expectedResult?: string;
  expected?: string;
  actual_result: string;
  actualResult?: string;
  actual?: string;
  status: TestStatus;
  duration_ms: number;
  durationMs?: number;
  url: string;
  evidence: string[];
  targetSelector?: string;
  testType?: string;
  error?: string;
  screenshotUrl?: string;
}

export interface TestResult {
  id?: string;
  testId: string;
  name: string;
  category: string;
  priority: Priority;
  status: TestStatus;
  durationMs: number;
  duration?: number;
  timestamp: string;
  expectedResult: string;
  expected?: string;
  actualResult: string;
  actual?: string;
  description?: string;
  problem?: string;
  suggestedFix?: string;
  evidence?: string[];
  error?: string;
  screenshotUrl?: string;
  consoleErrors?: string[];
  bugId?: string;
  attempts: number;
  flaky: boolean;
  firstAttempt?: TestStatus;
  secondAttempt?: TestStatus;
  selector?: string;
  flakyMessage?: string;
}

export interface AiBugAnalysis {
  possibleCause: string;
  suggestedFix: string;
  reproductionSteps: string[];
}

export interface BugReport {
  id: string;
  bug_id?: string;
  testId: string;
  testName?: string;
  category: string;
  websiteUrl: string;
  title: string;
  severity: Severity;
  priority?: Priority;
  description?: string;
  problem?: string;
  problemDescription?: string;
  affected_url?: string;
  steps_to_reproduce: string[];
  expected_result: string;
  actual_result: string;
  root_cause: string;
  fix_suggestion: string;
  suggestedFix?: string;
  error?: string;
  screenshotUrl?: string;
  evidence: string[];
  aiAnalysis?: AiBugAnalysis;
  date: string;
  status: 'Open' | 'Investigating' | 'Resolved';
  selector?: string;
}

export interface PerformanceMetrics {
  score: number;
  pageLoadTimeMs: number;
  domContentLoadedMs: number;
  fcpMs: number;
  lcpMs: number;
  cls: number;
  totalRequests: number;
  totalTransferSizeKb: number;
  jsSizeKb: number;
  cssSizeKb: number;
  imageSizeKb: number;
  fontSizeKb: number;
  bottlenecks: string[];
  recommendations: string[];
}

export interface AccessibilityAudit {
  score: number;
  missingAltCount: number;
  emptyButtonsCount: number;
  missingLabelsCount: number;
  duplicateIdsCount: number;
  headingIssuesCount: number;
  issues: Array<{
    type: string;
    severity: 'Critical' | 'Serious' | 'Moderate' | 'Minor';
    selector?: string;
    message: string;
    fix: string;
  }>;
}

export interface SecurityAudit {
  score: number;
  https: boolean;
  httpRedirectsToHttps: boolean;
  headers: Record<string, { present: boolean; value?: string; recommendation: string }>;
  mixedContentCount: number;
  issues: string[];
  recommendations: string[];
}

export interface SeoAudit {
  score: number;
  title?: string;
  titleLength: number;
  titleValid: boolean;
  metaDescription?: string;
  descLength: number;
  descValid: boolean;
  h1Count: number;
  h1Text?: string;
  h2Count: number;
  hasCanonical: boolean;
  hasRobotsMeta: boolean;
  hasOpenGraph: boolean;
  hasViewportMeta: boolean;
  issues: string[];
  recommendations: string[];
}

export interface NetworkLogItem {
  method: string;
  url: string;
  status: number;
  responseTimeMs: number;
  contentType: string;
  resourceType: string;
  transferSizeKb: number;
  failed: boolean;
}

export interface TestRunSummary {
  total_tests: number;
  passed: number;
  failed: number;
  warnings: number;
  skipped: number;
  not_applicable?: number;
  stopped?: number;
  flaky?: number;
  not_tested: number;
  critical_bugs: number;
  high_bugs: number;
  medium_bugs: number;
  low_bugs: number;
  performance_score: number;
  accessibility_score: number;
  security_score: number;
  seo_score: number;
}

export interface TestRun {
  id: string;
  url: string;
  website_type: string;
  overall_score: number;
  overallStatus?: OverallStatus;
  status: RunnerState;
  currentStep: number;
  stepName: string;
  statusMessage: string;
  categories: string[];
  createdAt: string;
  completedAt?: string;
  executionTimeMs?: number;
  summary: TestRunSummary;
  totalTests: number;
  completedTests: number;
  passedTests: number;
  failedTests: number;
  warningsCount: number;
  notApplicableCount?: number;
  findingsCount?: number;
  skippedTests: number;
  bugsCount: number;
  successRate: number;
  flakyCount?: number;
  scoreDifference?: number;
  previousScore?: number;
  unstableTestId?: string;
  unstableTestName?: string;
  unstableTestPrevStatus?: TestStatus;
  unstableTestCurrStatus?: TestStatus;
  instabilityWarning?: string;
  currentTestId?: string;
  currentTestName?: string;
  healthStatus?: string;
  testCases: TestCase[];
  results: TestResult[];
  bugs: BugReport[];
  warnings: WarningReport[];
  executionLogs: ExecutionLogEvent[];
  stopped?: boolean;
  performance?: PerformanceMetrics;
  accessibility?: AccessibilityAudit;
  security?: SecurityAudit;
  seo?: SeoAudit;
  networkLogs: NetworkLogItem[];
  consoleErrors: string[];
  recommendations: string[];
  humanReadableReport?: string;
  pageMetadata?: {
    title: string;
    description?: string;
    linksCount: number;
    buttonsCount: number;
    formsCount: number;
    loadTimeMs: number;
  };
  error?: string;
}

export interface ApiTestRequest {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string;
  expectedStatus?: number;
}

export interface ApiTestResult {
  id: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  pass: boolean;
  expectedStatus: number;
  statusText: string;
  responseHeaders: Record<string, string>;
  responseBody: string;
  timestamp: string;
  error?: string;
}

export interface DashboardStats {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  bugsFound: number;
  successRate: number;
  totalRuns: number;
  lastTestRun?: {
    id: string;
    url: string;
    createdAt: string;
    successRate: number;
    score: number;
    passed: number;
    failed: number;
  };
}
