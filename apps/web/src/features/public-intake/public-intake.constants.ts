export const PUBLIC_INTAKE_COPY = {
  PAGE_TITLE_SUFFIX: 'Customer Check-in',
  PAGE_TITLE_FORMAT: (orgName: string) => `${orgName} | Customer Check-in`,
  BADGE: 'Customer Self-Check-in',
  HEADING: 'Check In Your Item',
  SUBHEADING:
    'Enter your details below to submit your item and receive live status updates.',
  CUSTOMER_NAME_LABEL: 'Your Full Name',
  CUSTOMER_NAME_PLACEHOLDER: 'e.g. Jane Smith',
  CUSTOMER_PHONE_LABEL: 'Contact Phone Number',
  CUSTOMER_PHONE_PLACEHOLDER: 'e.g. +1 555 123 4567',
  CUSTOMER_PHONE_HINT: 'We use this to identify your item and notify you when ready.',
  SERVICE_TYPE_LABEL: 'Service Type',
  SERVICE_TYPE_PLACEHOLDER: 'Select a service type',
  ITEM_LABEL: 'Item & Service Details',
  ITEM_PLACEHOLDER:
    'Describe your item and the service or issue you are experiencing (e.g. 2021 Trek mountain bike - chain slipping in 4th gear)...',
  SUBMIT_BUTTON: 'Check In & Get Tracking Ticket',
  SUBMITTING_BUTTON: 'Checking In...',
  SUCCESS_TOAST_TITLE: 'Check-in Complete!',
  SUCCESS_TOAST_DESC:
    'Your service ticket has been created. Redirecting to your live tracking page...',
  FOOTER_ATTRIBUTION_PREFIX: 'Powered by',
  FOOTER_ATTRIBUTION_BRAND: 'TrackIt',
  NOT_FOUND_TITLE: 'Business Check-in Unavailable',
  NOT_FOUND_DESCRIPTION:
    'We could not find an active check-in portal for this business. Please verify the URL or contact the business directly for assistance.',
  RATE_LIMITED_TITLE: 'Too Many Requests',
  RATE_LIMITED_DESCRIPTION:
    'You have made too many requests in a short period. Please wait a moment before trying again.',
  LOADING_TITLE: 'Loading check-in portal...',
} as const;

