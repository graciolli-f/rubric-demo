 // Link preset as TypeScript module
export default `Component: Link
Description: "Secure link component with proper attributes"
Category: "Navigation"

@Structure {
  element: a
  href: required
  semanticHTML: true
}

@Validation {
  contrast: 4.5
  keyboard: required
  focusVisible: required
  externalLinks: required
  xss: required
  clickjacking: required
  screenReader: required
}

@Props {
  href: string
  children: ReactNode
  target?: "_blank" | "_self" | "_parent" | "_top"
  rel?: string
  ariaLabel?: string
  external?: boolean
}

@Style {
  guidelines: [
    "Use underline or other clear visual indicator",
    "Ensure links are distinguishable from text",
    "Provide hover and focus states",
    "Include external link icon for new windows",
    "Use consistent link colors across the site",
    "Avoid generic 'click here' text"
  ]
  
  tokens: {
    colors: ["link-default", "link-hover", "link-visited", "link-focus"]
  }
}

!Requirements:
! Must use HTTPS for external links [@validate: externalLinks]
! Must include rel="noopener noreferrer" for target="_blank" [@validate: externalLinks]
! Must be keyboard accessible [@validate: keyboard]
! Must have sufficient color contrast [@validate: contrast]
! Must have visible focus indicator [@validate: focusVisible]
! Must prevent clickjacking [@validate: clickjacking]
! Must have descriptive link text [@validate: screenReader]

?Recommendations:
? Use descriptive link text that makes sense out of context
? Include aria-label for icon-only links
? Indicate external links visually
? Avoid opening too many new windows
? Test with screen readers`;