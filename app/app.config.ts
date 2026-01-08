export default defineAppConfig({
  ui: {
    colors: {
      primary: 'solired',
      secondary: 'stone',
      neutral: 'stone',
      success: 'solired',
      info: 'stone',
      warning: 'yellow',
      error: 'red',
    },
    icons: {
      navHome: 'mingcute:home-2-line',
      navCss: 'mingcute:brush-line',
      navColors: 'mingcute:palette-line',
      navPreview: 'mingcute:eye-line',
      navComponents: 'mingcute:code-line',
      navGithub: 'mingcute:github-line',
      navLinkedIn: 'mingcute:link-line',
      menu: 'mingcute:menu-line',
      close: 'mingcute:close-line',
      sparkles: 'mingcute:sparkles-line',
      sun: 'mingcute:sun-line',
      moon: 'mingcute:moon-line',
      ellipsisVertical: 'mingcute:more-2-line',
      bookmark: 'mingcute:bookmark-line',
      folderOpen: 'mingcute:folder-open-line',
      download: 'mingcute:download-line',
      globe: 'mingcute:globe-line',
      clipboard: 'mingcute:clipboard-line',
      trash: 'mingcute:delete-line',
      pencil: 'mingcute:pencil-line',
      share: 'mingcute:share-2-line',
      checkCircle: 'mingcute:check-circle-line',
      triangleAlert: 'mingcute:warning-line',
      info: 'mingcute:information-line',
      box: 'mingcute:box-line',
      link: 'mingcute:link-line',
      layers: 'mingcute:layers-line',
      circleHelp: 'mingcute:question-line',
      chevronDown: 'mingcute:arrow-down-line',
      rotateCcw: 'mingcute:refresh-2-line',
      dot: 'mingcute:newdot-line',
      plus: 'mingcute:plus-line',
      check: 'mingcute:check-line',
      dice5: 'mingcute:random-line',
    },
    input: {
      slots: {
        root: `w-full`,
      },
    },
    button: {
      variants: {
        size: {
          xl: {
            base: 'px-4 py-2 text-lg gap-2',
          },
          lg: {
            base: 'px-3.5 py-1.75 text-base gap-2',
          },
          md: {
            base: 'px-3 py-1.5 text-md gap-1.5',
          }
        }
      }
    },
    pageCard: {
      slots: {
        description: 'text-sm text-ui-text-dimmed',
        container: '!p-5 !flex-row !gap-2',
      }
    },
    selectMenu: {
      slots: {
        content: 'min-w-fit'
      }
    },
    dashboardSidebar: {
      slots: {
        root: 'bg-muted',
      }
    }
  }
});
