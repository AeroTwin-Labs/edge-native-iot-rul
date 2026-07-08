# Aircraft Engine Predictive Maintenance Using Machine Learning

## Project Overview

This project develops a Machine Learning-based predictive maintenance system to estimate the Remaining Useful Life (RUL)** of aircraft engine components. Predicting RUL helps identify potential failures before they occur, enabling timely maintenance, reducing operational costs, minimizing downtime, and improving aircraft reliability.

The project uses the **`flight_components_condition_augmented_10000`** dataset from Kaggle. The dataset was further enhanced through feature engineering and preprocessing to improve prediction performance. Five machine learning algorithms were trained and evaluated, and the best-performing model was selected based on prediction accuracy.

---

## Problem Statement

Aircraft engine components experience continuous wear and degradation during operation. Traditional maintenance schedules are based on fixed intervals rather than the actual condition of the components, which can result in unnecessary maintenance or unexpected failures.

This project addresses this problem by using machine learning techniques to predict the Remaining Useful Life (RUL) of aircraft engine components based on historical operational and condition data.

---

## Objectives

* Predict the Remaining Useful Life (RUL) of aircraft engine components.
* Analyze aircraft engine condition using machine learning.
* Compare multiple machine learning algorithms.
* Identify the most accurate prediction model.
* Support predictive maintenance for improved reliability and safety.

---

## Dataset

This project uses the **`flight_components_condition_augmented_10000`** dataset obtained from **Kaggle**.

The dataset contains approximately **10,000 records** representing aircraft engine component conditions. The original dataset was enhanced by adding additional engineered features required for predictive maintenance. Data preprocessing, cleaning, and feature engineering were performed before training the machine learning models.

---

## Machine Learning Algorithms Used

Five machine learning algorithms were implemented and evaluated.

| Algorithm                       | Accuracy   |
| ------------------------------- | ---------- |
| Decision Tree                   | **93.00%** |
| Artificial Neural Network (ANN) | **92.00%** |
| Support Vector Machine (SVM)    | **95.00%** |
| Random Forest                   | **98.05%** |
| XGBoost                         | **98.20%** |

---

## Why These Algorithms Were Used

### Decision Tree

Used as a baseline machine learning model to predict the Remaining Useful Life (RUL) and compare its performance with other algorithms.

### Artificial Neural Network (ANN)

Used to learn complex relationships between aircraft engine features and predict the Remaining Useful Life (RUL).

### Support Vector Machine (SVM)

Used to evaluate the prediction performance of a margin-based machine learning model on the aircraft engine dataset.

### Random Forest

Used to improve prediction accuracy by combining multiple decision trees and reducing overfitting. It achieved an accuracy of **98.05%**.

### XGBoost

XGBoost achieved the highest accuracy of **98.20%** among all evaluated models.

It was selected as the final prediction model because it:

* Achieved the highest prediction accuracy.
* Handled complex feature relationships effectively.
* Reduced overfitting through regularization.
* Produced reliable Remaining Useful Life (RUL) predictions.

---

## Technologies Used

* Python
* Pandas
* NumPy
* Scikit-learn
* Decision Tree
* Artificial Neural Network (ANN)
* Support Vector Machine (SVM)
* Random Forest
* XGBoost
* Jupyter Notebook
* Git
* GitHub

---

## Project Structure

```text
Aircraft-Engine-Predictive-Maintenance/
│
├── dataset/
│   └── flight_components_condition_augmented_10000.xlsx
│
├── algorithm/
│   ├── DecisionTree.ipynb
│   ├── ANN.ipynb
│   ├── RandomForest.ipynb
│   ├── SVM.ipynb
│   └── XGBoost.ipynb
│
└── README.md
```

---

## Workflow

1. Collect the aircraft engine dataset.
2. Clean and preprocess the data.
3. Perform feature engineering.
4. Train five machine learning algorithms.
5. Compare the prediction accuracy of all models.
6. Select the best-performing model.
7. Predict the Remaining Useful Life (RUL) of aircraft engine components.

---

## Results

The performance comparison showed that **XGBoost** achieved the highest prediction accuracy of **98.20%**, followed by **Random Forest** with **98.05%**.

Based on the evaluation results, **XGBoost** was selected as the final model for predicting the Remaining Useful Life (RUL) of aircraft engine components.

---

## Team Members

**Project Lead**

* Keerthi S

**Team Members**

* Kartheeswaran
* Karthikesan
* Manikandan
* Lakshanasri

---

## License

This project is developed for academic and research purposes only.
