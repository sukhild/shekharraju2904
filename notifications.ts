import { User, Expense, Category, Role, Status } from './types';

// Placeholder for a real email sending service
export const sendEmailNotification = (to: User, subject: string, body: string) => {
  console.log(`
    ========================================
    📧 SIMULATING EMAIL NOTIFICATION 📧
    ----------------------------------------
    To: ${to.name} <${to.email}>
    Subject: ${subject}
    ----------------------------------------
    Body:
    ${body}
    ========================================
  `);
};

const formatDate = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const day = date.getDate().toString().padStart(2, '0');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

const formatDateTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${formatDate(isoString)} ${hours}:${minutes}:${seconds}`;
};

const getExpenseDetailsForEmail = (expense: Expense, categoryName: string): string => {
  return `
    Reference: ${expense.referenceNumber}
    Amount: ₹${expense.amount.toLocaleString('en-IN')}
    Category: ${categoryName}
    Description: ${expense.description}
    Submitted On: ${formatDateTime(expense.submittedAt)}
  `;
}

export const notifyRequestorOnSubmission = (requestor: User, expense: Expense, categoryName: string) => {
    const subject = `✅ Your expense request ${expense.referenceNumber} has been submitted`;
    const body = `
        Hi ${requestor.name},

        This is a confirmation that your expense request has been successfully submitted.
        
        ${getExpenseDetailsForEmail(expense, categoryName)}
        
        Current Status: ${expense.status}
        
        You will be notified of any status changes.
    `;
    sendEmailNotification(requestor, subject, body);
};

export const notifyVerifiersOnSubmission = (verifiers: User[], expense: Expense, categoryName: string) => {
    const subject = `Action Required: New expense ${expense.referenceNumber} from ${expense.requestorName}`;
    const body = `
        Hello Team,

        A new expense request requires your verification.
        
        Requestor: ${expense.requestorName}
        ${getExpenseDetailsForEmail(expense, categoryName)}
        
        Please log in to the portal to review and take action.
    `;
    verifiers.forEach(verifier => sendEmailNotification(verifier, subject, body));
};


export const notifyOnStatusChange = (
    requestor: User,
    expense: Expense,
    categoryName: string,
    comment?: string
) => {
    let subject = '';
    let body = '';
    const expenseDetails = getExpenseDetailsForEmail(expense, categoryName);

    switch(expense.status) {
        case Status.PENDING_APPROVAL:
            subject = `👍 Your expense request ${expense.referenceNumber} has been verified`;
            body = `
                Hi ${requestor.name},
                
                Good news! Your expense request has been verified and is now pending final approval.
                
                ${expenseDetails}
            `;
            break;
        case Status.APPROVED:
            subject = `🎉 Your expense request ${expense.referenceNumber} has been approved`;
            body = `
                Hi ${requestor.name},
                
                Your expense request has been approved. The amount will be reimbursed shortly.
                
                ${expenseDetails}
            `;
            break;
        case Status.REJECTED:
            subject = `❌ Your expense request ${expense.referenceNumber} has been rejected`;
            const reasonText = comment
                ? `Reason for rejection:\n"${comment}"\n`
                : 'No specific reason was provided.';
            
            body = `
                Hi ${requestor.name},
                
                Unfortunately, your expense request has been rejected.
                
                ${expenseDetails}
                
                ${reasonText}
                
                Please review the feedback and resubmit if necessary, or contact support for more details.
            `;
            break;
        default:
            return; // Don't send emails for other statuses from this function
    }
    
    sendEmailNotification(requestor, subject, body);
}


export const notifyApproversOnVerification = (approvers: User[], expense: Expense, categoryName: string) => {
    const subject = `Action Required: Verified expense ${expense.referenceNumber} needs approval`;
    const body = `
        Hello Team,

        A verified expense request requires your final approval.
        
        Requestor: ${expense.requestorName}
        ${getExpenseDetailsForEmail(expense, categoryName)}
        
        Please log in to the portal to review and take action.
    `;
    approvers.forEach(approver => sendEmailNotification(approver, subject, body));
};