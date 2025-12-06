//
//  DashboardViewController.swift
//  NuerloApp
//
//  Created on 2024
//

import UIKit
import WebKit
import FirebaseAuth

class DashboardViewController: UIViewController {
    
    private let webView = WKWebView()
    private let menuButton = UIButton()
    private let bottomMenuView = UIView()
    private let menuOverlay = UIView()
    private var isMenuOpen = false
    
    private let menuItems = [
        ("Home", "house.fill"),
        ("Courses", "book.fill"),
        ("Progress", "chart.bar.fill"),
        ("Profile", "person.fill"),
        ("Settings", "gearshape.fill"),
        ("Sign Out", "arrow.right.square.fill")
    ]
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        loadDashboard()
    }
    
    private func setupUI() {
        view.backgroundColor = .white
        
        setupWebView()
        setupMenuButton()
        setupBottomMenu()
    }
    
    private func setupWebView() {
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.navigationDelegate = self
        view.addSubview(webView)
        
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -60)
        ])
    }
    
    private func setupMenuButton() {
        menuButton.translatesAutoresizingMaskIntoConstraints = false
        menuButton.setImage(UIImage(systemName: "line.3.horizontal"), for: .normal)
        menuButton.tintColor = UIColor(red: 31/255, green: 41/255, blue: 55/255, alpha: 1.0)
        menuButton.backgroundColor = .white
        menuButton.layer.cornerRadius = 25
        menuButton.addTarget(self, action: #selector(toggleMenu), for: .touchUpInside)
        view.addSubview(menuButton)
        
        NSLayoutConstraint.activate([
            menuButton.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -20),
            menuButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            menuButton.widthAnchor.constraint(equalToConstant: 50),
            menuButton.heightAnchor.constraint(equalToConstant: 50)
        ])
    }
    
    private func setupBottomMenu() {
        menuOverlay.translatesAutoresizingMaskIntoConstraints = false
        menuOverlay.backgroundColor = UIColor.black.withAlphaComponent(0.5)
        menuOverlay.alpha = 0
        menuOverlay.addGestureRecognizer(UITapGestureRecognizer(target: self, action: #selector(closeMenu)))
        view.addSubview(menuOverlay)
        
        bottomMenuView.translatesAutoresizingMaskIntoConstraints = false
        bottomMenuView.backgroundColor = .white
        bottomMenuView.layer.cornerRadius = 24
        bottomMenuView.layer.maskedCorners = [.layerMinXMinYCorner, .layerMaxXMinYCorner]
        view.addSubview(bottomMenuView)
        
        let handleView = UIView()
        handleView.translatesAutoresizingMaskIntoConstraints = false
        handleView.backgroundColor = UIColor(red: 229/255, green: 231/255, blue: 235/255, alpha: 1.0)
        handleView.layer.cornerRadius = 2
        bottomMenuView.addSubview(handleView)
        
        let stackView = UIStackView()
        stackView.translatesAutoresizingMaskIntoConstraints = false
        stackView.axis = .vertical
        stackView.spacing = 0
        bottomMenuView.addSubview(stackView)
        
        for (index, (title, iconName)) in menuItems.enumerated() {
            let itemView = createMenuItem(title: title, icon: iconName, isLast: index == menuItems.count - 1)
            stackView.addArrangedSubview(itemView)
        }
        
        NSLayoutConstraint.activate([
            menuOverlay.topAnchor.constraint(equalTo: view.topAnchor),
            menuOverlay.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            menuOverlay.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            menuOverlay.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            
            bottomMenuView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            bottomMenuView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            bottomMenuView.bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: 400),
            bottomMenuView.heightAnchor.constraint(equalToConstant: CGFloat(menuItems.count * 60 + 40)),
            
            handleView.topAnchor.constraint(equalTo: bottomMenuView.topAnchor, constant: 12),
            handleView.centerXAnchor.constraint(equalTo: bottomMenuView.centerXAnchor),
            handleView.widthAnchor.constraint(equalToConstant: 40),
            handleView.heightAnchor.constraint(equalToConstant: 4),
            
            stackView.topAnchor.constraint(equalTo: handleView.bottomAnchor, constant: 20),
            stackView.leadingAnchor.constraint(equalTo: bottomMenuView.leadingAnchor),
            stackView.trailingAnchor.constraint(equalTo: bottomMenuView.trailingAnchor)
        ])
    }
    
    private func createMenuItem(title: String, icon: String, isLast: Bool) -> UIView {
        let container = UIView()
        container.translatesAutoresizingMaskIntoConstraints = false
        
        let iconView = UIImageView()
        iconView.translatesAutoresizingMaskIntoConstraints = false
        iconView.image = UIImage(systemName: icon)
        iconView.tintColor = title == "Sign Out" ? UIColor(red: 239/255, green: 68/255, blue: 68/255, alpha: 1.0) : UIColor(red: 31/255, green: 41/255, blue: 55/255, alpha: 1.0)
        container.addSubview(iconView)
        
        let label = UILabel()
        label.translatesAutoresizingMaskIntoConstraints = false
        label.text = title
        label.font = .systemFont(ofSize: 16, weight: .medium)
        label.textColor = title == "Sign Out" ? UIColor(red: 239/255, green: 68/255, blue: 68/255, alpha: 1.0) : UIColor(red: 31/255, green: 41/255, blue: 55/255, alpha: 1.0)
        container.addSubview(label)
        
        if !isLast {
            let divider = UIView()
            divider.translatesAutoresizingMaskIntoConstraints = false
            divider.backgroundColor = UIColor(red: 229/255, green: 231/255, blue: 235/255, alpha: 1.0)
            container.addSubview(divider)
            
            NSLayoutConstraint.activate([
                divider.leadingAnchor.constraint(equalTo: container.leadingAnchor, constant: 60),
                divider.trailingAnchor.constraint(equalTo: container.trailingAnchor),
                divider.bottomAnchor.constraint(equalTo: container.bottomAnchor),
                divider.heightAnchor.constraint(equalToConstant: 1)
            ])
        }
        
        let tapGesture = UITapGestureRecognizer(target: self, action: #selector(menuItemTapped(_:)))
        container.addGestureRecognizer(tapGesture)
        container.tag = menuItems.firstIndex(where: { $0.0 == title }) ?? 0
        
        NSLayoutConstraint.activate([
            container.heightAnchor.constraint(equalToConstant: 60),
            
            iconView.leadingAnchor.constraint(equalTo: container.leadingAnchor, constant: 20),
            iconView.centerYAnchor.constraint(equalTo: container.centerYAnchor),
            iconView.widthAnchor.constraint(equalToConstant: 24),
            iconView.heightAnchor.constraint(equalToConstant: 24),
            
            label.leadingAnchor.constraint(equalTo: iconView.trailingAnchor, constant: 16),
            label.centerYAnchor.constraint(equalTo: container.centerYAnchor)
        ])
        
        return container
    }
    
    @objc private func toggleMenu() {
        isMenuOpen.toggle()
        
        UIView.animate(withDuration: 0.3, animations: {
            self.menuOverlay.alpha = self.isMenuOpen ? 1 : 0
            self.bottomMenuView.transform = self.isMenuOpen ? .identity : CGAffineTransform(translationX: 0, y: 400)
        })
    }
    
    @objc private func closeMenu() {
        isMenuOpen = false
        UIView.animate(withDuration: 0.3) {
            self.menuOverlay.alpha = 0
            self.bottomMenuView.transform = CGAffineTransform(translationX: 0, y: 400)
        }
    }
    
    @objc private func menuItemTapped(_ gesture: UITapGestureRecognizer) {
        guard let view = gesture.view else { return }
        let index = view.tag
        
        if index == menuItems.count - 1 {
            signOut()
        } else {
            handleMenuItemSelection(index)
        }
        
        closeMenu()
    }
    
    private func handleMenuItemSelection(_ index: Int) {
        let item = menuItems[index]
        switch item.0 {
        case "Home":
            loadDashboard()
        case "Courses":
            loadURL("https://dashboard.nuerlo.com")
        case "Progress":
            loadURL("https://dashboard.nuerlo.com")
        case "Profile":
            loadURL("https://dashboard.nuerlo.com")
        case "Settings":
            loadURL("https://dashboard.nuerlo.com")
        default:
            break
        }
    }
    
    private func signOut() {
        do {
            try Auth.auth().signOut()
            let loginVC = LoginViewController()
            loginVC.modalPresentationStyle = .fullScreen
            present(loginVC, animated: true)
        } catch {
            print("Error signing out: \(error)")
        }
    }
    
    private func loadDashboard() {
        loadURL("https://dashboard.nuerlo.com")
    }
    
    private func loadURL(_ urlString: String) {
        guard let url = URL(string: urlString) else { return }
        let request = URLRequest(url: url)
        webView.load(request)
    }
}

extension DashboardViewController: WKNavigationDelegate {
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        print("Page loaded successfully")
    }
    
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("Failed to load page: \(error.localizedDescription)")
    }
}

