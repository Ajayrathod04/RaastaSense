import fs from 'fs';
import path from 'path';

export interface LogEntry {
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  message: string;
  timestamp: string;
  resource: {
    type: string;
    labels: Record<string, string>;
  };
  payload?: any;
  trace?: string;
}

export class CloudLogger {
  private static logFile = path.join(process.cwd(), 'cloud_simulation_logs.json');

  public static log(severity: LogEntry['severity'], message: string, payload?: any) {
    const entry: LogEntry = {
      severity,
      message,
      timestamp: new Date().toISOString(),
      resource: {
        type: 'gce_instance',
        labels: {
          project_id: 'raastasense-cloud-safety',
          instance_id: 'i-09f1ad20478a',
          zone: 'asia-south1-a'
        }
      },
      payload,
      trace: `projects/raastasense-cloud-safety/traces/${Math.random().toString(36).substring(2, 10)}`
    };

    // Print to stdout standard for Google Cloud Logging extraction
    console.log(JSON.stringify(entry));

    // Append to local audit file safely
    try {
      fs.appendFileSync(this.logFile, JSON.stringify(entry) + '\n', 'utf8');
    } catch (e) {
      // Quiet fail-safe: never crash the server under any circumstance
    }
  }

  public static info(message: string, payload?: any) {
    this.log('INFO', message, payload);
  }

  public static warning(message: string, payload?: any) {
    this.log('WARNING', message, payload);
  }

  public static error(message: string, payload?: any) {
    this.log('ERROR', message, payload);
  }

  public static debug(message: string, payload?: any) {
    this.log('DEBUG', message, payload);
  }
}
