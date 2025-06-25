// Button preset as TypeScript module
export default `Component: Button
Description: "Accessible, performant, and secure button component"
Category: "Interactive"

@Structure {
  element: button
  role: button
  interactive: true
}

@Validation {
  contrast: 4.5
  keyboard: required
  focusVisible: required
  touchTarget: 44
  motion: { respectsPreference: true }
  xss: required
  clickjacking: required
  bundleSize: { max: "2kb" }
  renderTime: { maxMs: 50 }
}

@Props {
  onClick?: function
  disabled?: boolean
  type?: "button" | "submit" | "reset" = "button"
  ariaLabel?: string
  children: ReactNode
}

@Style {
  guidelines: [
    "Use semantic button element, not div with onClick",
    "Ensure minimum 44x44px touch target",
    "Provide clear focus indicators (3px outline)",
    "Support keyboard navigation (Enter/Space)",
    "Include hover and active states",
    "Use design system color tokens"
  ]
  
  tokens: {
    colors: ["primary", "secondary", "disabled"]
    spacing: ["compact", "normal", "spacious"]
  }
}

!Requirements:
! Must be keyboard accessible [@validate: keyboard]
! Must have sufficient color contrast (WCAG AA) [@validate: contrast]
! Must have visible focus indicator [@validate: focusVisible]
! Must have minimum touch target size [@validate: touchTarget]
! Must respect prefers-reduced-motion [@validate: motion]
! Must prevent XSS vulnerabilities [@validate: xss]
! Must avoid clickjacking risks [@validate: clickjacking]

?Recommendations:
? Use semantic HTML button element
? Include ARIA labels for icon-only buttons
? Provide loading and disabled states
? Follow consistent naming conventions
? Test with screen readers`;