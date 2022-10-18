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
		let currentPath = location.pathname
		const cache = {}, // Stored page info
		documents = {}, // Stored html documents
		links = Array.from(nav.querySelectorAll('a')),
		updateContent = path => {
			// Replacing pagecontent and updating title
			nav.nextElementSibling.replaceWith(cache[path].content)
			document.title = cache[currentPath = path].title
			// Custom event that pages can listen to and run code after a navigation
			dispatchEvent(new CustomEvent('navigationfinished'))
		},
		goTo = url => {
			const path = new URL(url).pathname
			if (path == currentPath) return
			if (nav.matches('.open')) {
				// Closing the navigation without animating it
				nav.style.transitionDuration = '0s'
				nav.classList.remove('open')
				setTimeout(closeNav)
			}
			if (cache[path]) return updateContent(path)
			
			const html = documents[path]
			// Retry again after 500ms if the page hasn't been fetched due to slow internet
			if (!html) return setTimeout(() => goTo(url), 500)
			
			// Parsing the html
			
			const content = document.createRange()
				.createContextualFragment(
					html.slice(html.indexOf('<div id='), html.lastIndexOf('</div>') + 6)
				).firstChild,
			title = html.slice(html.indexOf('<title>') + 7, html.indexOf('</title>'))
			
			cache[path] = { content, title }
			updateContent(path)
		},
		prefetchLink = async href => {
			const path = new URL(href).pathname
			if (path == location.pathname || documents[path]) return
			const res = await fetch(href)
			documents[path] = await res.text()
		}

		// Fetching and storing all documents after page load
		onload = () => setTimeout(() => {
			links.forEach(link => prefetchLink(link.href))
		})

		// Click handler that overrides the normal navigation for the links
		onclick = e => {
			const link = e.target.closest('a')
			if (!link || e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) return
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

		cache[location.pathname] = {
			content: nav.nextElementSibling,
			title: document.title
		}

		onpopstate = () => goTo(location.href)
		
		// Public methods and properties for the router
		return {
			goTo, prefetchLink
		}
	})()

	// Public methods and properties for the navbar
	return {
		router, nav
	}
  
})()
