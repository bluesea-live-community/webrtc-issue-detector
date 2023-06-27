import {
  IssueDetectorResult,
  IssueReason,
  IssueType,
  WebRTCStatsParsed,
} from '../types';
import BaseIssueDetector from './BaseIssueDetector';

class OutboundAudioIssueDetector extends BaseIssueDetector {
  performDetection(data: WebRTCStatsParsed): IssueDetectorResult {
    const { connection: { id: connectionId } } = data;
    const issues = this.processData(data);
    this.setLastProcessedStats(connectionId, data);
    return issues;
  }

  private processData(data: WebRTCStatsParsed): IssueDetectorResult {
    const issues: IssueDetectorResult = [];
    if (data.connection.state !== 'succeeded') {
      return issues;
    }

    const previousStats = this.getLastProcessedStats(data.connection.id);
    if (!previousStats) {
      return issues;
    }

    const activeAudioStreams = data.audio.outbound.filter((stream) => !!stream.mediaSourceId);
    const previousActiveAudioStreams = previousStats.audio.outbound.filter((stream) => !!stream.mediaSourceId);
    if (!activeAudioStreams.length || !previousActiveAudioStreams.length) {
      return issues;
    }
    const audioPktSent = activeAudioStreams.reduce((sum, stream) => sum + stream.packetsSent, 0);
    const preAudioPktSent = previousActiveAudioStreams.reduce((sum, stream) => sum + stream.packetsSent, 0);

    if (audioPktSent === preAudioPktSent) {
      issues.push({
        type: IssueType.Stream,
        reason: IssueReason.OutboundAudioNoData,
      });
    }

    return issues;
  }
}

export default OutboundAudioIssueDetector;
