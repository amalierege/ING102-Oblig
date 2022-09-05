const navbar = (() => {
	const nav = document.querySelector('header'),
	burger = nav.querySelector('.burger'),
	media = matchMedia('(max-width: 35em)'),
	menuBtns = Array.from(nav.querySelectorAll('.menu-toggle')),
	themeToggle = nav.querySelector('#theme'),
	burgerClick = () => {
		// Disabling the button until the animation is finished
		burger.onclick = null
		setTimeout(() => { 
			burger.onclick = burgerClick
		}, 350)
		
		// Closing the nav
		if (!nav.classList.toggle('open')) closeNav()
		
	},
	closeNav = () => {
		menuBtns.forEach(btn => {
			btn.parentElement.className = 'menu-container'
		})
		nav.removeAttribute('style')
	}
	burger.onclick = burgerClick
	
	media.onchange = () => {
		if (!media.matches) {
			nav.classList.remove('open')
			closeNav()
		}
	}

	menuBtns.forEach(btn => {
		const linkCount = btn.nextElementSibling.childElementCount
		btn.onclick = () => {
			if (!media.matches) return
			
			if (btn.parentElement.classList.toggle('show')) {
				nav.style.height = `${16.1 + 3 * linkCount}rem`
				menuBtns.forEach(btn1 => {
					if (btn1 != btn) btn1.parentElement.className = 'menu-container'
				})
			}
			else nav.removeAttribute('style')
		}
	})

	themeToggle.checked = document.documentElement.className == 'light'
	// Making sure the it doesn't animate on pageload
	setTimeout(() => themeToggle.nextElementSibling.firstElementChild.style.transition = 'transform 50ms ease-in-out 0s')
	themeToggle.oninput = () => {
		const newTheme = themeToggle.checked ? 'light' : 'dark'
		localStorage.theme = document.documentElement.className = newTheme
	}
	
	// This router allows for fast navigation between pages without reloading
	const router = (() => {
		const cache = {}, // Stored page info
		documents = {}, // Stored html documents
		links = Array.from(nav.querySelectorAll('a')),
		updateContent = data => {
			// Replacing pagecontent and updating title
			nav.nextElementSibling.replaceWith(data.content)
			document.title = data.title
		}
		goTo = url => {
			if (nav.matches('.open')) {
				nav.style.transitionDuration = '0s'
				nav.classList.remove('open')
				setTimeout(closeNav)
			}
			if (cache[url]) return updateContent(cache[url])

			const html = documents[url]
			// Retry again after 500ms if the page hasn't been fetched due to slow internet
			if (!html) return setTimeout(() => goTo(url), 500)

			// Parsing the html
			const content = document.createRange()
				.createContextualFragment(
					html.slice(html.indexOf('<div id='), html.lastIndexOf('</div>') + 6)
				).firstChild,
			title = html.slice(html.indexOf('<title>') + 7, html.indexOf('</title>'))
			
			updateContent(cache[url] = { content, title })
		}

		// Fetching and storing all documents after page load
		onload = () => setTimeout(() => {
			links.forEach(async link => {
				const href = link.href.split('?')[0]
				if (href == location.href) return
				const res = await fetch(href)
				documents[href] = await res.text()
			})
		})

		links.forEach(link => {
			// Click handler that overrides the normal navigation for the links
			link.onclick = e => {
				if (e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) return

				link.blur()
				e.preventDefault()
				if (link.href != location.href) history.pushState({}, '', link.href)

				if (link.matches('.dropdown *') && !media.matches) {
					// Making sure the dropdown closes after you click a link
					const dropdown = link.closest('.dropdown')
					dropdown.style.display = 'none'
					setTimeout(() => dropdown.removeAttribute('style'))
				}
				
				router.goTo(link.href)
			}
		})

		cache[location.href] = {
			content: nav.nextElementSibling,
			title: document.title
		}

		onpopstate = () => goTo(location.href)
		
		// Public methods and properties for the router
		return {
			goTo
		}
	})()

	// Public methods and properties for the navbar
	return {
		router
	}
  
})()