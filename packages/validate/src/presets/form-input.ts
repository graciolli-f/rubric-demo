 // Form input preset as TypeScript module
export default `Component: FormInput
Description: "Secure and accessible form input field"
Category: "Form"

@Structure {
  element: input
  labelRequired: true
  errorHandling: true
}

@Validation {
  contrast: 4.5
  keyboard: required
  focusVisible: required
  touchTarget: 44
  screenReader: required
  xss: required
  bundleSize: { max: "1.5kb" }
}

@Props {
  type: "text" | "email" | "password" | "number" | "tel" | "url"
  label: string
  name: string
  value?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  ariaDescribedBy?: string
}

@Style {
  guidelines: [
    "Always pair inputs with visible labels",
    "Use proper input types for better mobile UX",
    "Provide clear error messages below the field",
    "Include proper autocomplete attributes",
    "Ensure 44px minimum height for touch",
    "Use border color changes for focus states"
  ]
  
  tokens: {
    colors: ["input-border", "input-focus", "input-error", "label-text"]
    spacing: ["input-padding", "label-margin"]
  }
}

!Requirements:
! Must have associated label element [@validate: screenReader]
! Must be keyboard navigable [@validate: keyboard]
! Must have visible focus state [@validate: focusVisible]
! Must meet touch target size [@validate: touchTarget]
! Must prevent XSS in value handling [@validate: xss]
! Must have sufficient contrast [@validate: contrast]

?Recommendations:
? Use semantic HTML5 input types
? Include helpful placeholder text
? Provide inline validation feedback
? Support autocomplete attributes
? Test with password managers`;