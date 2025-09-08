#!/usr/bin/env python3
"""
Setup script for CVR API Documentation
"""

import os
import sys
import subprocess
from pathlib import Path

def run_command(cmd, description):
    """Run a command and handle errors."""
    print(f"📦 {description}...")
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e.stderr}")
        return False

def check_prerequisites():
    """Check if required tools are installed."""
    print("🔍 Checking prerequisites...")
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        return False
    print("✅ Python version is compatible")
    
    # Check if pip is available
    try:
        subprocess.run([sys.executable, "-m", "pip", "--version"], 
                      check=True, capture_output=True)
        print("✅ pip is available")
    except subprocess.CalledProcessError:
        print("❌ pip is not available")
        return False
    
    return True

def setup_environment():
    """Set up the development environment."""
    print("\n🚀 Setting up CVR API Documentation development environment...")
    
    if not check_prerequisites():
        print("\n❌ Prerequisites not met. Please install required tools.")
        return False
    
    # Install Python dependencies
    if not run_command(f"{sys.executable} -m pip install -r requirements.txt", 
                      "Installing Python dependencies"):
        return False
    
    # Create .env file if it doesn't exist
    if not os.path.exists('.env'):
        if os.path.exists('.env.example'):
            run_command("cp .env.example .env", "Creating .env file from template")
            print("📝 Please edit .env file with your CVR API credentials")
        else:
            print("⚠️  .env.example file not found")
    else:
        print("✅ .env file already exists")
    
    # Test MkDocs installation
    if not run_command("mkdocs --version", "Testing MkDocs installation"):
        return False
    
    print("\n🎉 Setup completed successfully!")
    print("\n📚 Next steps:")
    print("1. Edit .env file with your CVR API credentials")
    print("2. Run 'mkdocs serve' to start development server")
    print("3. Open http://127.0.0.1:8000 in your browser")
    print("4. Start contributing! See CONTRIBUTING.md for guidelines")
    
    return True

def main():
    """Main setup function."""
    print("🇩🇰 CVR API Documentation Setup")
    print("=" * 40)
    
    # Change to script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    if setup_environment():
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()