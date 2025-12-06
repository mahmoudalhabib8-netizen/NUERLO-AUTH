//
//  LoginViewController.swift
//  NuerloApp
//
//  Created on 2024
//

import UIKit
import FirebaseAuth

class LoginViewController: UIViewController {
    
    private let scrollView = UIScrollView()
    private let contentView = UIView()
    
    private let topGradientView = UIView()
    private let bottomWhiteView = UIView()
    private let authCard = UIView()
    
    private let logoImageView = UIImageView()
    private let headingLabel = UILabel()
    private let subtitleLabel = UILabel()
    
    private let emailTextField = UITextField()
    private let passwordTextField = UITextField()
    private let rememberMeCheckbox = UIButton()
    private let rememberMeLabel = UILabel()
    private let forgotPasswordButton = UIButton()
    
    private let loginButton = UIButton()
    private let dividerView = UIView()
    private let dividerLabel = UILabel()
    
    private let googleButton = UIButton()
    private let facebookButton = UIButton()
    
    private let errorLabel = UILabel()
    private let switchToRegisterButton = UIButton()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        checkAuthState()
    }
    
    private func checkAuthState() {
        if Auth.auth().currentUser != nil {
            navigateToDashboard()
        }
    }
    
    private func setupUI() {
        view.backgroundColor = .white
        
        setupScrollView()
        setupTopGradient()
        setupBottomWhite()
        setupAuthCard()
        setupLogo()
        setupHeading()
        setupForm()
        setupButtons()
        setupSocialButtons()
        setupErrorLabel()
        setupSwitchButton()
    }
    
    private func setupScrollView() {
        scrollView.translatesAutoresizingMaskIntoConstraints = false
        scrollView.showsVerticalScrollIndicator = false
        view.addSubview(scrollView)
        
        contentView.translatesAutoresizingMaskIntoConstraints = false
        scrollView.addSubview(contentView)
        
        NSLayoutConstraint.activate([
            scrollView.topAnchor.constraint(equalTo: view.topAnchor),
            scrollView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            scrollView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            scrollView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            
            contentView.topAnchor.constraint(equalTo: scrollView.topAnchor),
            contentView.leadingAnchor.constraint(equalTo: scrollView.leadingAnchor),
            contentView.trailingAnchor.constraint(equalTo: scrollView.trailingAnchor),
            contentView.bottomAnchor.constraint(equalTo: scrollView.bottomAnchor),
            contentView.widthAnchor.constraint(equalTo: scrollView.widthAnchor),
            contentView.heightAnchor.constraint(equalToConstant: UIScreen.main.bounds.height)
        ])
    }
    
    private func setupTopGradient() {
        topGradientView.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(topGradientView)
        
        let gradientLayer = CAGradientLayer()
        gradientLayer.colors = [
            UIColor(red: 164/255, green: 118/255, blue: 255/255, alpha: 1.0).cgColor,
            UIColor(red: 139/255, green: 95/255, blue: 255/255, alpha: 1.0).cgColor,
            UIColor(red: 184/255, green: 148/255, blue: 255/255, alpha: 1.0).cgColor
        ]
        gradientLayer.startPoint = CGPoint(x: 0, y: 0)
        gradientLayer.endPoint = CGPoint(x: 1, y: 1)
        topGradientView.layer.addSublayer(gradientLayer)
        
        NSLayoutConstraint.activate([
            topGradientView.topAnchor.constraint(equalTo: contentView.topAnchor),
            topGradientView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor),
            topGradientView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor),
            topGradientView.heightAnchor.constraint(equalTo: contentView.heightAnchor, multiplier: 0.5)
        ])
        
        DispatchQueue.main.async {
            gradientLayer.frame = self.topGradientView.bounds
        }
    }
    
    private func setupBottomWhite() {
        bottomWhiteView.translatesAutoresizingMaskIntoConstraints = false
        bottomWhiteView.backgroundColor = .white
        contentView.addSubview(bottomWhiteView)
        
        NSLayoutConstraint.activate([
            bottomWhiteView.topAnchor.constraint(equalTo: topGradientView.bottomAnchor),
            bottomWhiteView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor),
            bottomWhiteView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor),
            bottomWhiteView.bottomAnchor.constraint(equalTo: contentView.bottomAnchor)
        ])
    }
    
    private func setupAuthCard() {
        authCard.translatesAutoresizingMaskIntoConstraints = false
        authCard.backgroundColor = .white
        authCard.layer.cornerRadius = 24
        authCard.layer.borderWidth = 1
        authCard.layer.borderColor = UIColor(red: 229/255, green: 231/255, blue: 235/255, alpha: 1.0).cgColor
        contentView.addSubview(authCard)
        
        NSLayoutConstraint.activate([
            authCard.centerXAnchor.constraint(equalTo: contentView.centerXAnchor),
            authCard.topAnchor.constraint(equalTo: contentView.topAnchor, constant: UIScreen.main.bounds.height * 0.48 - 200),
            authCard.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 20),
            authCard.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -20),
            authCard.heightAnchor.constraint(greaterThanOrEqualToConstant: 500)
        ])
    }
    
    private func setupLogo() {
        logoImageView.translatesAutoresizingMaskIntoConstraints = false
        logoImageView.image = UIImage(named: "NUERLO-LOGO")
        logoImageView.contentMode = .scaleAspectFit
        topGradientView.addSubview(logoImageView)
        
        NSLayoutConstraint.activate([
            logoImageView.topAnchor.constraint(equalTo: topGradientView.topAnchor, constant: 32),
            logoImageView.leadingAnchor.constraint(equalTo: topGradientView.leadingAnchor, constant: 32),
            logoImageView.widthAnchor.constraint(equalToConstant: 48),
            logoImageView.heightAnchor.constraint(equalToConstant: 50)
        ])
    }
    
    private func setupHeading() {
        headingLabel.translatesAutoresizingMaskIntoConstraints = false
        headingLabel.text = "Welcome back"
        headingLabel.font = .systemFont(ofSize: 32, weight: .semibold)
        headingLabel.textColor = UIColor(red: 31/255, green: 41/255, blue: 55/255, alpha: 1.0)
        headingLabel.numberOfLines = 0
        authCard.addSubview(headingLabel)
        
        subtitleLabel.translatesAutoresizingMaskIntoConstraints = false
        subtitleLabel.text = "Sign in to continue to your account"
        subtitleLabel.font = .systemFont(ofSize: 15, weight: .regular)
        subtitleLabel.textColor = UIColor(red: 107/255, green: 114/255, blue: 128/255, alpha: 1.0)
        subtitleLabel.numberOfLines = 0
        authCard.addSubview(subtitleLabel)
        
        NSLayoutConstraint.activate([
            headingLabel.topAnchor.constraint(equalTo: authCard.topAnchor, constant: 36),
            headingLabel.leadingAnchor.constraint(equalTo: authCard.leadingAnchor, constant: 40),
            headingLabel.trailingAnchor.constraint(equalTo: authCard.trailingAnchor, constant: -40),
            
            subtitleLabel.topAnchor.constraint(equalTo: headingLabel.bottomAnchor, constant: 8),
            subtitleLabel.leadingAnchor.constraint(equalTo: authCard.leadingAnchor, constant: 40),
            subtitleLabel.trailingAnchor.constraint(equalTo: authCard.trailingAnchor, constant: -40)
        ])
    }
    
    private func setupForm() {
        emailTextField.translatesAutoresizingMaskIntoConstraints = false
        emailTextField.placeholder = "Email"
        emailTextField.keyboardType = .emailAddress
        emailTextField.autocapitalizationType = .none
        emailTextField.autocorrectionType = .no
        emailTextField.backgroundColor = .white
        emailTextField.layer.borderWidth = 1.5
        emailTextField.layer.borderColor = UIColor(red: 229/255, green: 231/255, blue: 235/255, alpha: 1.0).cgColor
        emailTextField.layer.cornerRadius = 10
        emailTextField.leftView = UIView(frame: CGRect(x: 0, y: 0, width: 16, height: 0))
        emailTextField.leftViewMode = .always
        emailTextField.font = .systemFont(ofSize: 15)
        emailTextField.textColor = UIColor(red: 31/255, green: 41/255, blue: 55/255, alpha: 1.0)
        authCard.addSubview(emailTextField)
        
        passwordTextField.translatesAutoresizingMaskIntoConstraints = false
        passwordTextField.placeholder = "Password"
        passwordTextField.isSecureTextEntry = true
        passwordTextField.backgroundColor = .white
        passwordTextField.layer.borderWidth = 1.5
        passwordTextField.layer.borderColor = UIColor(red: 229/255, green: 231/255, blue: 235/255, alpha: 1.0).cgColor
        passwordTextField.layer.cornerRadius = 10
        passwordTextField.leftView = UIView(frame: CGRect(x: 0, y: 0, width: 16, height: 0))
        passwordTextField.leftViewMode = .always
        passwordTextField.font = .systemFont(ofSize: 15)
        passwordTextField.textColor = UIColor(red: 31/255, green: 41/255, blue: 55/255, alpha: 1.0)
        authCard.addSubview(passwordTextField)
        
        let rememberContainer = UIView()
        rememberContainer.translatesAutoresizingMaskIntoConstraints = false
        authCard.addSubview(rememberContainer)
        
        rememberMeCheckbox.translatesAutoresizingMaskIntoConstraints = false
        rememberMeCheckbox.setImage(UIImage(systemName: "square"), for: .normal)
        rememberMeCheckbox.setImage(UIImage(systemName: "checkmark.square.fill"), for: .selected)
        rememberMeCheckbox.tintColor = UIColor(red: 164/255, green: 118/255, blue: 255/255, alpha: 1.0)
        rememberMeCheckbox.addTarget(self, action: #selector(toggleRememberMe), for: .touchUpInside)
        rememberContainer.addSubview(rememberMeCheckbox)
        
        rememberMeLabel.translatesAutoresizingMaskIntoConstraints = false
        rememberMeLabel.text = "Remember me"
        rememberMeLabel.font = .systemFont(ofSize: 14)
        rememberMeLabel.textColor = UIColor(red: 107/255, green: 114/255, blue: 128/255, alpha: 1.0)
        rememberContainer.addSubview(rememberMeLabel)
        
        forgotPasswordButton.translatesAutoresizingMaskIntoConstraints = false
        forgotPasswordButton.setTitle("Forgot password?", for: .normal)
        forgotPasswordButton.setTitleColor(UIColor(red: 164/255, green: 118/255, blue: 255/255, alpha: 1.0), for: .normal)
        forgotPasswordButton.titleLabel?.font = .systemFont(ofSize: 14, weight: .medium)
        forgotPasswordButton.addTarget(self, action: #selector(forgotPasswordTapped), for: .touchUpInside)
        authCard.addSubview(forgotPasswordButton)
        
        NSLayoutConstraint.activate([
            emailTextField.topAnchor.constraint(equalTo: subtitleLabel.bottomAnchor, constant: 24),
            emailTextField.leadingAnchor.constraint(equalTo: authCard.leadingAnchor, constant: 40),
            emailTextField.trailingAnchor.constraint(equalTo: authCard.trailingAnchor, constant: -40),
            emailTextField.heightAnchor.constraint(equalToConstant: 48),
            
            passwordTextField.topAnchor.constraint(equalTo: emailTextField.bottomAnchor, constant: 16),
            passwordTextField.leadingAnchor.constraint(equalTo: authCard.leadingAnchor, constant: 40),
            passwordTextField.trailingAnchor.constraint(equalTo: authCard.trailingAnchor, constant: -40),
            passwordTextField.heightAnchor.constraint(equalToConstant: 48),
            
            rememberContainer.topAnchor.constraint(equalTo: passwordTextField.bottomAnchor, constant: 16),
            rememberContainer.leadingAnchor.constraint(equalTo: authCard.leadingAnchor, constant: 40),
            rememberContainer.heightAnchor.constraint(equalToConstant: 24),
            
            rememberMeCheckbox.leadingAnchor.constraint(equalTo: rememberContainer.leadingAnchor),
            rememberMeCheckbox.centerYAnchor.constraint(equalTo: rememberContainer.centerYAnchor),
            rememberMeCheckbox.widthAnchor.constraint(equalToConstant: 20),
            rememberMeCheckbox.heightAnchor.constraint(equalToConstant: 20),
            
            rememberMeLabel.leadingAnchor.constraint(equalTo: rememberMeCheckbox.trailingAnchor, constant: 8),
            rememberMeLabel.centerYAnchor.constraint(equalTo: rememberContainer.centerYAnchor),
            rememberMeLabel.trailingAnchor.constraint(equalTo: rememberContainer.trailingAnchor),
            
            forgotPasswordButton.centerYAnchor.constraint(equalTo: rememberContainer.centerYAnchor),
            forgotPasswordButton.trailingAnchor.constraint(equalTo: authCard.trailingAnchor, constant: -40)
        ])
    }
    
    private func setupButtons() {
        loginButton.translatesAutoresizingMaskIntoConstraints = false
        loginButton.setTitle("Sign in", for: .normal)
        loginButton.setTitleColor(.white, for: .normal)
        loginButton.titleLabel?.font = .systemFont(ofSize: 15, weight: .semibold)
        loginButton.backgroundColor = UIColor(red: 31/255, green: 41/255, blue: 55/255, alpha: 1.0)
        loginButton.layer.cornerRadius = 10
        loginButton.addTarget(self, action: #selector(loginTapped), for: .touchUpInside)
        authCard.addSubview(loginButton)
        
        dividerView.translatesAutoresizingMaskIntoConstraints = false
        dividerView.backgroundColor = UIColor(red: 229/255, green: 231/255, blue: 235/255, alpha: 1.0)
        authCard.addSubview(dividerView)
        
        dividerLabel.translatesAutoresizingMaskIntoConstraints = false
        dividerLabel.text = "or continue with"
        dividerLabel.font = .systemFont(ofSize: 14)
        dividerLabel.textColor = UIColor(red: 107/255, green: 114/255, blue: 128/255, alpha: 1.0)
        dividerLabel.backgroundColor = .white
        dividerLabel.textAlignment = .center
        authCard.addSubview(dividerLabel)
        
        NSLayoutConstraint.activate([
            loginButton.topAnchor.constraint(equalTo: forgotPasswordButton.bottomAnchor, constant: 16),
            loginButton.leadingAnchor.constraint(equalTo: authCard.leadingAnchor, constant: 40),
            loginButton.trailingAnchor.constraint(equalTo: authCard.trailingAnchor, constant: -40),
            loginButton.heightAnchor.constraint(equalToConstant: 48),
            
            dividerView.topAnchor.constraint(equalTo: loginButton.bottomAnchor, constant: 16),
            dividerView.leadingAnchor.constraint(equalTo: authCard.leadingAnchor, constant: 40),
            dividerView.trailingAnchor.constraint(equalTo: authCard.trailingAnchor, constant: -40),
            dividerView.heightAnchor.constraint(equalToConstant: 1),
            
            dividerLabel.centerXAnchor.constraint(equalTo: dividerView.centerXAnchor),
            dividerLabel.centerYAnchor.constraint(equalTo: dividerView.centerYAnchor),
            dividerLabel.widthAnchor.constraint(equalToConstant: 120)
        ])
    }
    
    private func setupSocialButtons() {
        googleButton.translatesAutoresizingMaskIntoConstraints = false
        googleButton.setTitle("Continue with Google", for: .normal)
        googleButton.setTitleColor(UIColor(red: 55/255, green: 65/255, blue: 81/255, alpha: 1.0), for: .normal)
        googleButton.titleLabel?.font = .systemFont(ofSize: 15, weight: .medium)
        googleButton.backgroundColor = .white
        googleButton.layer.borderWidth = 1.5
        googleButton.layer.borderColor = UIColor(red: 229/255, green: 231/255, blue: 235/255, alpha: 1.0).cgColor
        googleButton.layer.cornerRadius = 10
        googleButton.addTarget(self, action: #selector(googleSignInTapped), for: .touchUpInside)
        authCard.addSubview(googleButton)
        
        facebookButton.translatesAutoresizingMaskIntoConstraints = false
        facebookButton.setTitle("Continue with Facebook", for: .normal)
        facebookButton.setTitleColor(UIColor(red: 55/255, green: 65/255, blue: 81/255, alpha: 1.0), for: .normal)
        facebookButton.titleLabel?.font = .systemFont(ofSize: 15, weight: .medium)
        facebookButton.backgroundColor = .white
        facebookButton.layer.borderWidth = 1.5
        facebookButton.layer.borderColor = UIColor(red: 229/255, green: 231/255, blue: 235/255, alpha: 1.0).cgColor
        facebookButton.layer.cornerRadius = 10
        facebookButton.addTarget(self, action: #selector(facebookSignInTapped), for: .touchUpInside)
        authCard.addSubview(facebookButton)
        
        NSLayoutConstraint.activate([
            googleButton.topAnchor.constraint(equalTo: dividerView.bottomAnchor, constant: 24),
            googleButton.leadingAnchor.constraint(equalTo: authCard.leadingAnchor, constant: 40),
            googleButton.trailingAnchor.constraint(equalTo: authCard.trailingAnchor, constant: -40),
            googleButton.heightAnchor.constraint(equalToConstant: 48),
            
            facebookButton.topAnchor.constraint(equalTo: googleButton.bottomAnchor, constant: 12),
            facebookButton.leadingAnchor.constraint(equalTo: authCard.leadingAnchor, constant: 40),
            facebookButton.trailingAnchor.constraint(equalTo: authCard.trailingAnchor, constant: -40),
            facebookButton.heightAnchor.constraint(equalToConstant: 48)
        ])
    }
    
    private func setupErrorLabel() {
        errorLabel.translatesAutoresizingMaskIntoConstraints = false
        errorLabel.textColor = UIColor(red: 153/255, green: 27/255, blue: 27/255, alpha: 1.0)
        errorLabel.font = .systemFont(ofSize: 14)
        errorLabel.numberOfLines = 0
        errorLabel.textAlignment = .center
        errorLabel.isHidden = true
        authCard.addSubview(errorLabel)
        
        NSLayoutConstraint.activate([
            errorLabel.topAnchor.constraint(equalTo: facebookButton.bottomAnchor, constant: 16),
            errorLabel.leadingAnchor.constraint(equalTo: authCard.leadingAnchor, constant: 40),
            errorLabel.trailingAnchor.constraint(equalTo: authCard.trailingAnchor, constant: -40)
        ])
    }
    
    private func setupSwitchButton() {
        switchToRegisterButton.translatesAutoresizingMaskIntoConstraints = false
        switchToRegisterButton.setTitle("Don't have an account? Sign up", for: .normal)
        switchToRegisterButton.setTitleColor(UIColor(red: 164/255, green: 118/255, blue: 255/255, alpha: 1.0), for: .normal)
        switchToRegisterButton.titleLabel?.font = .systemFont(ofSize: 14, weight: .medium)
        switchToRegisterButton.addTarget(self, action: #selector(switchToRegister), for: .touchUpInside)
        authCard.addSubview(switchToRegisterButton)
        
        NSLayoutConstraint.activate([
            switchToRegisterButton.topAnchor.constraint(equalTo: errorLabel.bottomAnchor, constant: 16),
            switchToRegisterButton.centerXAnchor.constraint(equalTo: authCard.centerXAnchor),
            switchToRegisterButton.bottomAnchor.constraint(equalTo: authCard.bottomAnchor, constant: -36)
        ])
    }
    
    @objc private func toggleRememberMe() {
        rememberMeCheckbox.isSelected.toggle()
    }
    
    @objc private func forgotPasswordTapped() {
        // TODO: Implement forgot password
    }
    
    @objc private func loginTapped() {
        guard let email = emailTextField.text, !email.isEmpty,
              let password = passwordTextField.text, !password.isEmpty else {
            showError("Please fill in all fields")
            return
        }
        
        loginButton.isEnabled = false
        loginButton.alpha = 0.6
        
        Auth.auth().signIn(withEmail: email, password: password) { [weak self] result, error in
            DispatchQueue.main.async {
                self?.loginButton.isEnabled = true
                self?.loginButton.alpha = 1.0
                
                if let error = error {
                    self?.showError(error.localizedDescription)
                } else {
                    self?.navigateToDashboard()
                }
            }
        }
    }
    
    @objc private func googleSignInTapped() {
        // TODO: Implement Google Sign In
    }
    
    @objc private func facebookSignInTapped() {
        // TODO: Implement Facebook Sign In
    }
    
    @objc private func switchToRegister() {
        let registerVC = RegisterViewController()
        registerVC.modalPresentationStyle = .fullScreen
        present(registerVC, animated: true)
    }
    
    private func showError(_ message: String) {
        errorLabel.text = message
        errorLabel.isHidden = false
    }
    
    private func navigateToDashboard() {
        let dashboardVC = DashboardViewController()
        dashboardVC.modalPresentationStyle = .fullScreen
        present(dashboardVC, animated: true)
    }
}

