import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import os

# Set random seed for reproducibility
np.random.seed(42)

# Define paths
excel_input_path = "D:\\Kathik\\flight_components_condition_augmented_10000.xlsx"
excel_output_path = "D:\\Kathik\\flight_components_condition_with_sensors.xlsx"
artifact_dir = r"C:\Users\anmat\.gemini\antigravity-ide\brain\6090274e-3d36-47d9-b65a-a17ec921e4b0"

print("Step 1: Reading dataset...")
df = pd.read_excel(excel_input_path)

print("Step 2: Augmenting dataset with telemetry fields (Temperature, Vibration, Pressure)...")

# Helper groups for mapping source labels
serviceable_statuses = ['Healthy', 'Serviceable']
marginal_statuses = ['Warning', 'Marginal', 'Under Repair']
critical_statuses = ['Critical', 'Unserviceable']

# Helper function to generate sensor values based on Component Type and Condition Status
def generate_sensors(row):
    comp_type = row['Component Type']
    status = row['Condition Status']
    wear = row['Wear Level (%)']
    
    # Defaults
    temp, vib, press = 70.0, 2.5, 2000.0
    
    if comp_type == 'APU':
        if status in serviceable_statuses:
            temp = np.random.uniform(65, 85)
            vib = np.random.uniform(2.0, 4.5)
            press = np.random.uniform(1100, 1300)
        elif status in marginal_statuses:
            temp = np.random.uniform(85, 105)
            vib = np.random.uniform(4.5, 7.5)
            press = np.random.uniform(950, 1100)
        else: # Critical or Unserviceable
            temp = np.random.uniform(105, 125)
            vib = np.random.uniform(7.5, 11.0)
            press = np.random.uniform(700, 950)
            
    elif comp_type == 'Landing Gear':
        if status in serviceable_statuses:
            temp = np.random.uniform(20, 45)
            vib = np.random.uniform(0.5, 2.0)
            press = np.random.uniform(2700, 3100)
        elif status in marginal_statuses:
            temp = np.random.uniform(45, 65)
            vib = np.random.uniform(2.0, 4.5)
            press = np.random.choice([np.random.uniform(2300, 2700), np.random.uniform(3100, 3400)])
        else: # Critical or Unserviceable
            temp = np.random.uniform(65, 90)
            vib = np.random.uniform(4.5, 8.0)
            press = np.random.choice([np.random.uniform(1500, 2300), np.random.uniform(3400, 3900)])
            
    elif comp_type == 'Brake Unit':
        if status in serviceable_statuses:
            temp = np.random.uniform(40, 75)
            vib = np.random.uniform(1.5, 3.5)
            press = np.random.uniform(1900, 2300)
        elif status in marginal_statuses:
            temp = np.random.uniform(75, 105)
            vib = np.random.uniform(3.5, 6.5)
            press = np.random.choice([np.random.uniform(1400, 1900), np.random.uniform(2300, 2700)])
        else: # Critical or Unserviceable
            temp = np.random.uniform(105, 140)
            vib = np.random.uniform(6.5, 10.0)
            press = np.random.choice([np.random.uniform(800, 1400), np.random.uniform(2700, 3600)])
            
    else: # Engine
        if status in serviceable_statuses:
            temp = np.random.uniform(70, 90)
            vib = np.random.uniform(1.8, 3.8)
            press = np.random.uniform(2300, 2700)
        elif status in marginal_statuses:
            temp = np.random.uniform(90, 115)
            vib = np.random.uniform(3.8, 7.5)
            press = np.random.choice([np.random.uniform(1800, 2300), np.random.uniform(2700, 3100)])
        else: # Critical or Unserviceable
            temp = np.random.uniform(115, 145)
            vib = np.random.uniform(7.5, 12.0)
            press = np.random.choice([np.random.uniform(1000, 1800), np.random.uniform(3100, 4000)])
            
    return pd.Series([round(temp, 1), round(vib, 2), round(press, 0)])

# Apply augmentation to df
df[['OperatingTemp', 'VibrationLevel', 'Pressure']] = df.apply(generate_sensors, axis=1)

# Rearrange columns slightly to fit server mapping expectations
cols = list(df.columns)
# Inject before Condition Status
idx = cols.index('Condition Status')
cols = cols[:idx] + ['OperatingTemp', 'VibrationLevel', 'Pressure'] + cols[idx:]
df = df.reindex(columns=list(dict.fromkeys(cols)))

# Save augmented excel
print(f"Saving augmented Excel dataset to {excel_output_path}...")
df.to_excel(excel_output_path, index=False)

print("Step 3: Performing Exploratory Data Analysis (EDA)...")
# Plot 1: Correlation Heatmap
plt.figure(figsize=(10, 8))
numeric_cols = ['Flight Hours', 'Cycles', 'Wear Level (%)', 'OperatingTemp', 'VibrationLevel', 'Pressure', 'Remaining Life (%)']
corr = df[numeric_cols].corr()
sns.heatmap(corr, annot=True, cmap='coolwarm', fmt=".2f", linewidths=0.5)
plt.title('Correlation Matrix of Mechanical & Telemetry Features')
plt.tight_layout()
heatmap_path = os.path.join(artifact_dir, "eda_correlation_heatmap.png")
plt.savefig(heatmap_path)
plt.close()
print(f"Saved correlation heatmap to {heatmap_path}")

# Plot 2: Sensor Distributions by Condition Status
fig, axes = plt.subplots(1, 3, figsize=(18, 5))
sns.boxplot(ax=axes[0], data=df, x='Condition Status', y='OperatingTemp', hue='Condition Status', palette='Set2', legend=False)
axes[0].set_title('Operating Temperature by Component Condition')
axes[0].set_ylabel('Temperature (°C)')

sns.boxplot(ax=axes[1], data=df, x='Condition Status', y='VibrationLevel', hue='Condition Status', palette='Set2', legend=False)
axes[1].set_title('Vibration Level by Component Condition')
axes[1].set_ylabel('Vibration Level (mm/s)')

sns.boxplot(ax=axes[2], data=df, x='Condition Status', y='Pressure', hue='Condition Status', palette='Set2', legend=False)
axes[2].set_title('Pressure by Component Condition')
axes[2].set_ylabel('Pressure (psi)')

plt.tight_layout()
dist_path = os.path.join(artifact_dir, "eda_sensor_distributions.png")
plt.savefig(dist_path)
plt.close()
print(f"Saved sensor distributions plot to {dist_path}")

print("Step 4: Machine Learning Model Training (Random Forest)...")
# Encode Condition Status target variable mapping all 7 original statuses
status_mapping = {
    'Healthy': 0, 'Serviceable': 0,
    'Warning': 1, 'Marginal': 1, 'Under Repair': 1,
    'Critical': 2, 'Unserviceable': 2
}
y = df['Condition Status'].map(status_mapping)

# Prepare Features
X = df[['Flight Hours', 'Cycles', 'Wear Level (%)', 'OperatingTemp', 'VibrationLevel', 'Pressure']]

# Train Test Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

print(f"Training set size: {X_train.shape[0]} samples")
print(f"Testing set size: {X_test.shape[0]} samples")

# Train Random Forest Classifier
rf_model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, class_weight='balanced')
rf_model.fit(X_train, y_train)

# Predict and Evaluate
y_pred = rf_model.predict(X_test)
train_acc = accuracy_score(y_train, rf_model.predict(X_train))
test_acc = accuracy_score(y_test, y_pred)

print(f"\nModel Results:")
print(f"Train Accuracy: {train_acc:.4f}")
print(f"Test Accuracy: {test_acc:.4f}")

print("\nClassification Report:")
target_names = ['Serviceable', 'Marginal', 'Critical']
print(classification_report(y_test, y_pred, target_names=target_names))

print("Confusion Matrix:")
print(confusion_matrix(y_test, y_pred))

# Feature Importance
importances = rf_model.feature_importances_
feature_names = X.columns
forest_importances = pd.Series(importances, index=feature_names).sort_values(ascending=False)

print("\nFeature Importances:")
for name, imp in forest_importances.items():
    print(f" - {name}: {imp:.4f}")

# Plot Feature Importance
plt.figure(figsize=(8, 5))
sns.barplot(x=forest_importances.values, y=forest_importances.index, palette='viridis', hue=forest_importances.index, legend=False)
plt.title('Random Forest Feature Importances')
plt.xlabel('Mean Decrease in Impurity (MDI)')
plt.tight_layout()
importance_path = os.path.join(artifact_dir, "eda_feature_importances.png")
plt.savefig(importance_path)
plt.close()
print(f"Saved feature importances plot to {importance_path}")

print("\nModeling and Analysis successfully completed.")
