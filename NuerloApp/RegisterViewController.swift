//
//  RegisterViewController.swift
//  NuerloApp
//
//  Created on 2024
//

import UIKit
import FirebaseAuth

class RegisterViewController: UIViewController {
    
    private let scrollView = UIScrollView()
    private let contentView = UIView()
    
    private let topGradientView = UIView()
    private let bottomWhiteView = UIView()
    private let authCard = UIView()
    
    private let logoImageView = UIImageView()
    private let headingLabel = UILabel()
    private let subtitleLabel = UILabel()
    
    private let nameTextField = UITextField()
    private let emailTextField = UITextField()
    private let passwordTextField = UITextField()
    private let confirmPasswordTextField = UITextField()
    
    private let termsCheckbox = UIButton()
    private let termsLabel = UILabel()
    
    private let registerButton = UIButton()
    private let dividerView = UIView()
    private let dividerLabel = UILabel()
    
    private let googleButton = UIButton()
    private let facebookButton = UIButton()
    
    private let errorLabel = UILabel()
    private let switchToLoginButton = UIButton()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
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
            contentView.heightAnchor.constraint(greaterThanOrEqualTo: scrollView.heightAnchor)
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
            topGradientView.heightAnchor.constraint(equalToConstant: 300)
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
            authCard.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 200),
            authCard.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 20),
            authCard.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -20)
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
        headingLabel.text = "Create account"
        headingLabel.font = .systemFont(ofSize: 32, weight: .semibold)
        headingLabel.textColor = UIColor(red: 31/255, green: 41/255, blue: 55/255, alpha: 1.0)
        headingLabel.numberOfLines = 0
        authCard.addSubview(headingLabel)
        
        subtitleLabel.translatesAutoresizingMaskIntoConstraints = false
        subtitleLabel.text = "Sign up to get started"
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
        nameTextField.translatesAutoresizingMaskIntoConstraints = false
        nameTextField.placeholder = "Full name"
        nameTextField.autocapitalizationType = .words
        nameTextField.backgroundColor = .white
        nameTextField.layer.borderWidth = 1.5
        nameTextField.layer.borderColor = UIColor(red: 229/255, green: 231/255, blue: 235/255, alpha: 1.0).cgColor
        nameTextField.layer.cornerRadius = 10
        nameTextField.leftView = UIView(frame: CGRect(x: 0, y: 0, width: 16, height: 0))
        nameTextField.leftViewMode = .always
        nameTextField.font = .systemFont(ofSize: 15)
        nameTextField.textColor = UIColor(red: 31/255, green: 41/255, blue: 55/255, alpha: 1.0)
        authCard.addSubview(nameTextField)
        
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
        
        confirmPasswordTextField.translatesAutoresizingMaskIntoConstraints = false
        confirmPasswordTextField.placeholder = "Confirm password"
        confirmPasswordTextField.isSecureTextEntry = true
        confirmPasswordTextField.backgroundColor = .white
        confirmPasswordTextField.layer.borderWidth = 1.5
        confirmPasswordTextField.layer.borderColor = UIColor(red: 229/255, green: 231/255, blue: 235/255, alpha: 1.0).cgColor
        confirmPasswordTextField.layer.cornerRadius = 10
        confirmPasswordTextField.leftView = UIView(frame: CGRect(x: 0, y: 0, width: 16, height: 0))
        confirmPasswordTextField.leftViewMode = .always
        confirmPasswordTextField.font = .systemFont(ofSize: 15)
        confirmPasswordTextField.textColor = UIColor(red: 31/255, green: 41/255, blue: 55/255, alpha: 1.0)
        authCard.addSubview(confirmPasswordTextField)
        
        let termsContainer = UIView()
        termsContainer.translatesAutoresizingMaskIntoConstraints = false
        authCard.addSubview(termsContainer)
        
        termsCheckbox.translatesAutoresizingMaskIntoConstraints = false
        termsCheckbox.setImage(UIImage(systemName: "square"), for: .normal)
        termsCheckbox.setImage(UIImage(systemName: "checkmark.square.fill"), for: .selected)
        termsCheckbox.tintColor = UIColor(red: 164/255, green: 118/255, blue: 255/255, alpha: 1.0)
        termsCheckbox.addTarget(self, action: #selector(toggleTerms), for: .touchUpInside)
        termsContainer.addSubview(termsCheckbox)
        
        termsLabel.translatesAutoresizingMaskIntoConstraints = false
        let termsText = NSMutableAttributedString(string: "I agree to the ", attributes: [.foregroundColor: UIColor(red: 107/255, green: 114/255, blue: 128/255, alpha: 1.0), .font: UIFont.systemFont(ofSize: 14)])
        termsText.append(NSAttributedString(string: "Terms of Service", attributes: [.foregroundColor: UIColor(red: 164/255, green: 118/255, blue: 255/255, alpha: 1.0), .font: UIFont.systemFont(ofSize: 14, weight: .medium)]))
        termsText.append(NSAttributedString(string: " and ", attributes: [.foregroundColor: UIColor(red: 107/255, green: 114/255, blue: 128/255, alpha: 1.0), .font: UIFont.systemFont(ofSize: 14)]))
        termsText.append(NSAttributedString(string: "Privacy Policy", attributes: [.foregroundColor: UIColor(red: 164/255, green: 118/255, blue: 255/255, alpha: 1.0), .font: UIFont.systemFont(ofSize: 14, weight: .medium)]))
        termsLabel.attributedText = termsText
        termsLabel.numberOfLines = 0
        termsContainer.addSubview(termsLabel)
        
        NSLayoutConstraint.activate([
            nameTextField.topAnchor.constraint(equalTo: subtitleLabel.bottomAnchor, constant: 24),
            nameTextField.leadingAnchor.constraint(equalTo: authCard.leadingAnchor, constant: 40),
            nameTextField.trailingAnchor.constraint(equalTo: authCard.trailingAnchor, constant: -40),
            nameTextField.heightAnchor.constraint(equalToConstant: 48),
            
            emailTextField.topAnchor.constraint(equalTo: nameTextField.bottomAnchor, constant: 16),
            emailTextField.leadingAnchor.constraint(equalTo: authCard.leadingAnchor, constant: 40),
            emailTextField.trailingAnchor.constraint(equalTo: authCard.trailingAnchor, constant: -40),
            emailTextField.heightAnchor.constraint(equalToConstant: 48),
            
            passwordTextField.topAnchor.constraint(equalTo: emailTextField.bottomAnchor, constant: 16),
            passwordTextField.leadingAnchor.constraint(equalTo: authCard.leadingAnchor, constant: 40),
            passwordTextField.trailingAnchor.constraint(equalTo: authCard.trailingAnchor, constant: -40),
            passwordTextField.heightAnchor.constraint(equalToConstant: 48),
            
            confirmPasswordTextField.topAnchor.constraint(equalTo: passwordTextField.bottomAnchor, constant: 16),
            confirmPasswordTextField.leadingAnchor.constraint(equalTo: authCard.leadingAnchor, constant: 40),
            confirmPasswordTextField.trailingAnchor.constraint(equalTo: authCard.trailingAnchor, constant: -40),
            confirmPasswordTextField.heightAnchor.constraint(equalToConstant: 48),
            
            termsContainer.topAnchor.constraint(equalTo: confirmPasswordTextField.bottomAnchor, constant: 16),
            termsContainer.leadingAnchor.constraint(equalTo: authCard.leadingAnchor, constant: 40),
            termsContainer.trailingAnchor.constraint(equalTo: authCard.trailingAnchor, constant: -40),
            
            termsCheckbox.leadingAnchor.constraint(equalTo: termsContainer.leadingAnchor),
            termsCheckbox.topAnchor.constraint(equalTo: termsContainer.topAnchor),
            termsCheckbox.widthAnchor.constraint(equalToConstant: 20),
            termsCheckbox.heightAnchor.constraint(equalToConstant: 20),
            
            termsLabel.leadingAnchor.constraint(equalTo: termsCheckbox.trailingAnchor, constant: 8),
            termsLabel.trailingAnchor.constraint(equalTo: termsContainer.trailingAnchor),
            termsLabel.topAnchor.constraint(equalTo: termsContainer.topAnchor),
            termsLabel.bottomAnchor.constraint(equalTo: termsContainer.bottomAnchor)
        ])
    }
    
    private func setupButtons() {
        registerButton.translatesAutoresizingMaskIntoConstraints = false
        registerButton.setTitle("Create account", for: .normal)
        registerButton.setTitleColor(.white, for: .normal)
        registerButton.titleLabel?.font = .systemFont(ofSize: 15, weight: .semibold)
        registerButton.backgroundColor = UIColor(red: 31/255, green: 41/255, blue: 55/255, alpha: 1.0)
        registerButton.layer.cornerRadius = 10
        registerButton.addTarget(self, action: #selector(registerTapped), for: .touchUpInside)
        authCard.addSubview(registerButton)
        
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
            registerButton.topAnchor.constraint(equalTo: termsLabel.bottomAnchor, constant: 20),
            registerButton.leadingAnchor.constraint(equalTo: authCard.leadingAnchor, constant: 40),
            registerButton.trailingAnchor.constraint(equalTo: authCard.trailingAnchor, constant: -40),
            registerButton.heightAnchor.constraint(equalToConstant: 48),
            
            dividerView.topAnchor.constraint(equalTo: registerButton.bottomAnchor, constant: 16),
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
        switchToLoginButton.translatesAutoresizingMaskIntoConstraints = false
        switchToLoginButton.setTitle("Already have an account? Sign in", for: .normal)
        switchToLoginButton.setTitleColor(UIColor(red: 164/255, green: 118/255, blue: 255/255, alpha: 1.0), for: .normal)
        switchToLoginButton.titleLabel?.font = .systemFont(ofSize: 14, weight: .medium)
        switchToLoginButton.addTarget(self, action: #selector(switchToLogin), for: .touchUpInside)
        authCard.addSubview(switchToLoginButton)
        
        NSLayoutConstraint.activate([
            switchToLoginButton.topAnchor.constraint(equalTo: errorLabel.bottomAnchor, constant: 16),
            switchToLoginButton.centerXAnchor.constraint(equalTo: authCard.centerXAnchor),
            switchToLoginButton.bottomAnchor.constraint(equalTo: authCard.bottomAnchor, constant: -36)
        ])
    }
    
    @objc private func toggleTerms() {
        termsCheckbox.isSelected.toggle()
    }
    
    @objc private func registerTapped() {
        guard let name = nameTextField.text, !name.isEmpty,
              let email = emailTextField.text, !email.isEmpty,
              let password = passwordTextField.text, !password.isEmpty,
              let confirmPassword = confirmPasswordTextField.text, !confirmPassword.isEmpty else {
            showError("Please fill in all fields")
            return
        }
        
        guard password == confirmPassword else {
            showError("Passwords do not match")
            return
        }
        
        guard termsCheckbox.isSelected else {
            showError("Please accept the terms and conditions")
            return
        }
        
        registerButton.isEnabled = false
        registerButton.alpha = 0.6
        
        Auth.auth().createUser(withEmail: email, password: password) { [weak self] result, error in
            DispatchQueue.main.async {
                self?.registerButton.isEnabled = true
                self?.registerButton.alpha = 1.0
                
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
    
    @objc private func switchToLogin() {
        dismiss(animated: true)
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

