// Feedback describes the latest action, not the customer's accumulated result.
export function beautyActionMood(before,after,hardFailureBefore=false,hardFailureAfter=false){
 if(hardFailureAfter&&!hardFailureBefore)return 'angry';
 if(hardFailureBefore&&!hardFailureAfter)return 'satisfied';
 if(after>before+.001)return 'satisfied';
 if(after<before-.001)return 'angry';
 return 'neutral';
}
